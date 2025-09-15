import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { auth, requireRole } from "../middleware/auth.js";

const prisma = new PrismaClient();
const router = Router();

// Local enums (runtime-safe) — match Prisma schema
const OrderStatusEnum = z.enum(["created", "confirmed", "shipped", "delivered", "cancelled"]);
const PaymentStatusEnum = z.enum(["pending", "paid", "failed", "refunded"]);

const CreateOrder = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  paymentMethod: z.enum(["cod", "razorpay"]).optional().default("cod"),
  shippingAddress: z.string().min(5).optional().default(""),
});

const UpdateOrder = z
  .object({
    status: OrderStatusEnum.optional(),
    paymentStatus: PaymentStatusEnum.optional(),
  })
  .refine((v) => v.status || v.paymentStatus, { message: "Provide status or paymentStatus" });

type OrderItemSnap = {
  productId: string;
  title: string;
  price: number; // numeric snapshot
  quantity: number;
  sellerId: string;
};

function paginate(query: any) {
  const page = Math.max(1, Number(query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? 20)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/** POST /api/orders  (buyer or admin) */
router.post("/", auth, requireRole("buyer", "admin"), async (req, res) => {
  const parsed = CreateOrder.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "ValidationError", details: parsed.error.flatten() });
  }

  const wanted = parsed.data.items;

  // Fetch products and build a snapshot (convert Decimal -> number)
  const products = await prisma.product.findMany({
    where: { id: { in: wanted.map((i) => i.productId) } },
    select: { id: true, title: true, price: true, sellerId: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const items: OrderItemSnap[] = [];
  for (const i of wanted) {
    const p = byId.get(i.productId);
    if (!p) return res.status(400).json({ error: `Product not found: ${i.productId}` });
    items.push({
      productId: p.id,
      title: p.title,
      price: Number(p.price),
      quantity: i.quantity,
      sellerId: p.sellerId,
    });
  }

  const amount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const order = await prisma.order.create({
    data: {
      buyerId: req.user!.id,
      items: items as any, // jsonb snapshot
      status: "created",
      paymentStatus: "pending",
      amount, // Decimal column accepts number
    },
  });

  res.status(201).json(order);
});

/** GET /api/orders/mine (buyer or seller) */
router.get("/mine", auth, async (req, res) => {
  const role = req.user!.role;

  const all = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
  });

  if (role === "buyer") {
    const mine = all.filter((o) => o.buyerId === req.user!.id);
    return res.json(mine);
  }

  if (role === "seller") {
    const mine = all.filter((o) => {
      const items = (o.items as unknown as OrderItemSnap[]) || [];
      return items.some((it) => it.sellerId === req.user!.id);
    });
    return res.json(mine);
  }

  return res.status(403).json({ error: "Forbidden" });
});

/** GET /api/orders (admin) with pagination */
router.get("/", auth, requireRole("admin"), async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const [items, total] = await Promise.all([
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, skip, take: limit }),
    prisma.order.count(),
  ]);
  res.json({ page, limit, total, items });
});

/** GET /api/orders/:id (buyer owns it, seller involved, or admin) */
router.get("/:id", auth, async (req, res) => {
  const id = req.params.id;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return res.status(404).json({ error: "Not found" });

  const role = req.user!.role;
  if (role === "admin") return res.json(order);
  if (role === "buyer" && order.buyerId === req.user!.id) return res.json(order);
  if (role === "seller") {
    const items = (order.items as unknown as OrderItemSnap[]) || [];
    if (items.some((i) => i.sellerId === req.user!.id)) return res.json(order);
  }
  return res.status(403).json({ error: "Forbidden" });
});

/** PUT /api/orders/:id/status (admin or involved seller) */
router.put("/:id/status", auth, async (req, res) => {
  const id = req.params.id;
  const parsed = UpdateOrder.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "ValidationError", details: parsed.error.flatten() });
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return res.status(404).json({ error: "Not found" });

  // permission checks
  if (req.user!.role !== "admin") {
    if (req.user!.role !== "seller") return res.status(403).json({ error: "Forbidden" });
    const items = (order.items as unknown as OrderItemSnap[]) || [];
    const involved = items.some((i) => i.sellerId === req.user!.id);
    if (!involved) return res.status(403).json({ error: "Forbidden" });

    if (parsed.data.paymentStatus) {
      return res.status(403).json({ error: "Only admin can change paymentStatus" });
    }
  }

  // Build a typed patch for Prisma
  const patch: any = {};
  if (parsed.data.status) patch.status = parsed.data.status;
  if (parsed.data.paymentStatus) patch.paymentStatus = parsed.data.paymentStatus;

  const updated = await prisma.order.update({
    where: { id },
    data: patch,
  });

  res.json(updated);
});

export default router;
