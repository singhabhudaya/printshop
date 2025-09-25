import { Router } from "express";
import prismaPkg from "@prisma/client";               // runtime
import type { Role, PaymentStatus, OrderStatus } from "@prisma/client"; // types only
import { z } from "zod";
import { auth, requireRole } from "../middleware/auth.js";

const { PrismaClient } = prismaPkg;
const prisma = new PrismaClient();
const router = Router();

/** --------- helpers --------- */
function paginate(query: any) {
  const page = Math.max(1, Number(query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? 20)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/** --------- schemas --------- */
const UpdateUserRole = z.object({
  role: z.nativeEnum((prismaPkg as any).Role), // runtime enum
});

const CreatePayout = z.object({
  sellerId: z.string().min(1),
  amount: z.number().positive(),
});

const UpdatePayout = z.object({
  status: z.enum(["pending", "processing", "paid", "failed"]),
});

/** --------- routes --------- */

/** GET /api/admin/stats */
router.get("/stats", auth, requireRole("admin"), async (_req, res) => {
  const [users, sellers, products, orders, paidRevenue] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "seller" } }),
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { amount: true }, // ✅ use amount field, not total
      where: { paymentStatus: (prismaPkg as any).PaymentStatus.paid },
    }),
  ]);

  res.json({
    users,
    sellers,
    products,
    orders,
    revenue: paidRevenue._sum.amount ?? 0, // ✅ fix
  });
});

/** GET /api/admin/users?role=buyer|seller|admin */
router.get("/users", auth, requireRole("admin"), async (req, res) => {
  const { role } = req.query as { role?: Role };
  const { page, limit, skip } = paginate(req.query);

  const where: any = {};
  if (role) where.role = role;

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ items, page, limit, total });
});

/** PUT /api/admin/users/:id/role */
router.put("/users/:id/role", auth, requireRole("admin"), async (req, res) => {
  const parsed = UpdateUserRole.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({ error: "ValidationError", details: parsed.error.flatten() });

  try {
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { role: parsed.data.role },
    });
    res.json({ id: updated.id, role: updated.role });
  } catch {
    res.status(404).json({ error: "User not found" });
  }
});

/** GET /api/admin/orders?status=&paymentStatus= */
router.get("/orders", auth, requireRole("admin"), async (req, res) => {
  const { status, paymentStatus } = req.query as {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
  };
  const { page, limit, skip } = paginate(req.query);

  const where: any = {};
  if (status) where.status = status;
  if (paymentStatus) where.paymentStatus = paymentStatus;

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.count({ where }),
  ]);

  res.json({ items, page, limit, total });
});

/** GET /api/admin/payouts */
router.get("/payouts", auth, requireRole("admin"), async (req, res) => {
  const { page, limit, skip } = paginate(req.query);

  const [items, total] = await Promise.all([
    prisma.payout.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        seller: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.payout.count(),
  ]);

  res.json({ items, page, limit, total });
});

/** POST /api/admin/payouts */
router.post("/payouts", auth, requireRole("admin"), async (req, res) => {
  const parsed = CreatePayout.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({ error: "ValidationError", details: parsed.error.flatten() });

  const seller = await prisma.user.findUnique({
    where: { id: parsed.data.sellerId },
  });
  if (!seller || seller.role !== "seller")
    return res.status(400).json({ error: "Invalid sellerId" });

  const created = await prisma.payout.create({
    data: { sellerId: parsed.data.sellerId, amount: parsed.data.amount },
  });

  res.status(201).json(created);
});

/** PUT /api/admin/payouts/:id */
router.put("/payouts/:id", auth, requireRole("admin"), async (req, res) => {
  const parsed = UpdatePayout.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({ error: "ValidationError", details: parsed.error.flatten() });

  try {
    const updated = await prisma.payout.update({
      where: { id: req.params.id },
      data: { status: parsed.data.status },
    });
    res.json(updated);
  } catch {
    res.status(404).json({ error: "Payout not found" });
  }
});

export default router;
