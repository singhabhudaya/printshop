import { Router } from "express";
import { z } from "zod";
import { Types } from "mongoose";
import { auth, requireRole } from "../middleware/auth.js";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";

const router = Router();

// Enums to mirror your previous Prisma-side types
const OrderStatusEnum = z.enum(["created", "confirmed", "shipped", "delivered", "cancelled"]);
const PaymentStatusEnum = z.enum(["pending", "paid", "failed", "refunded"]);

const CreateOrder = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
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
  price: number;
  quantity: number;
  sellerId: string;
};

function paginate(query: any) {
  const page = Math.max(1, Number(query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? 20)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/** POST /api/orders  (buyer or admin)
 *  Body: { items: [{productId, quantity}], paymentMethod?, shippingAddress? }
 *  - Looks up products
 *  - Creates JSON snapshot items [{productId,title,price,quantity,sellerId}]
 *  - Computes amount
 */
router.post("/", auth, requireRole("buyer", "admin"), async (req, res, next) => {
  try {
    const parsed = CreateOrder.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "ValidationError", details: parsed.error.flatten() });
    }

    const wanted = parsed.data.items;
    const ids = wanted.map((i) => i.productId).filter(Boolean);
    const objIds = ids.map((s) => new Types.ObjectId(s));

    // fetch products
    const products = await Product.find(
      { _id: { $in: objIds } },
      { _id: 1, title: 1, price: 1, sellerId: 1 }
    );

    const byId = new Map(products.map((p) => [String(p._id), p]));
    const snap: OrderItemSnap[] = [];

    for (const i of wanted) {
      const p = byId.get(i.productId);
      if (!p) return res.status(400).json({ error: `Product not found: ${i.productId}` });
      snap.push({
        productId: String(p._id),
        title: p.title,
        price: Number(p.price),
        quantity: i.quantity,
        sellerId: String(p.sellerId ?? ""), // ensure string
      });
    }

    const amount = snap.reduce((sum, it) => sum + it.price * it.quantity, 0);

    const order = await Order.create({
      buyerId: req.user!.id, // Mongoose will cast to ObjectId
      items: snap,
      amount,
      paymentMethod: parsed.data.paymentMethod,
      shippingAddress: parsed.data.shippingAddress,
      status: "created",
      paymentStatus: "pending",
    });

    res.status(201).json(order);
  } catch (e) { next(e); }
});

/** GET /api/orders/mine (buyer or seller)
 *  - buyer: orders where buyerId == me
 *  - seller: orders where any item.sellerId == me
 */
router.get("/mine", auth, async (req, res, next) => {
  try {
    const role = req.user!.role;

    if (role === "buyer") {
      const items = await Order.find({ buyerId: req.user!.id }).sort({ createdAt: -1 });
      return res.json(items);
    }

    if (role === "seller") {
      const me = String(req.user!.id);
      // items.sellerId is a string snapshot; compare to string form of seller _id
      const items = await Order.find({ "items.sellerId": me }).sort({ createdAt: -1 });
      return res.json(items);
    }

    return res.status(403).json({ error: "Forbidden" });
  } catch (e) { next(e); }
});

/** GET /api/orders (admin) with pagination */
router.get("/", auth, requireRole("admin"), async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const [items, total] = await Promise.all([
      Order.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(),
    ]);
    res.json({ page, limit, total, items });
  } catch (e) { next(e); }
});

/** GET /api/orders/:id (buyer owns it, seller involved, or admin) */
router.get("/:id", auth, async (req, res, next) => {
  try {
    const id = req.params.id;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: "Not found" });

    const role = req.user!.role;
    if (role === "admin") return res.json(order);

    if (role === "buyer" && String(order.buyerId) === req.user!.id) return res.json(order);

    if (role === "seller") {
      const involved = (order.items || []).some((i: any) => i.sellerId === req.user!.id);
      if (involved) return res.json(order);
    }

    return res.status(403).json({ error: "Forbidden" });
  } catch (e) { next(e); }
});

/** PUT /api/orders/:id/status (admin or involved seller)
 *  - sellers CANNOT change paymentStatus
 */
router.put("/:id/status", auth, async (req, res, next) => {
  try {
    const id = req.params.id;
    const parsed = UpdateOrder.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "ValidationError", details: parsed.error.flatten() });
    }

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ error: "Not found" });

    // permission checks
    if (req.user!.role !== "admin") {
      if (req.user!.role !== "seller") return res.status(403).json({ error: "Forbidden" });
      const involved = (order.items || []).some((i: any) => i.sellerId === req.user!.id);
      if (!involved) return res.status(403).json({ error: "Forbidden" });
      if (parsed.data.paymentStatus) {
        return res.status(403).json({ error: "Only admin can change paymentStatus" });
      }
    }

    // patch
    const updates: any = {};
    if (parsed.data.status) updates.status = parsed.data.status;
    if (parsed.data.paymentStatus) updates.paymentStatus = parsed.data.paymentStatus;

    const updated = await Order.findByIdAndUpdate(id, updates, { new: true });
    res.json(updated);
  } catch (e) { next(e); }
});

export default router;
