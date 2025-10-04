import { Router } from "express";
import { z } from "zod";
import { auth, requireRole } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { Payout } from "../models/Payout.js";

const router = Router();

/** ---------- helpers ---------- */
function paginate(query: any) {
  const page = Math.max(1, Number(query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? 20)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/** ---------- schemas ---------- */
const UpdateUserRole = z.object({
  role: z.enum(["buyer", "seller", "admin"]),
});

const CreatePayout = z.object({
  sellerId: z.string().min(1),
  amount: z.number().positive(),
});

const UpdatePayout = z.object({
  status: z.enum(["pending", "processing", "paid", "failed"]),
});

// For filtering orders
const OrderStatusEnum = z.enum(["created", "confirmed", "shipped", "delivered", "cancelled"]);
const PaymentStatusEnum = z.enum(["pending", "paid", "failed", "refunded"]);

/** ---------- routes ---------- */

/** GET /api/admin/stats */
router.get("/stats", auth, requireRole("admin"), async (_req, res, next) => {
  try {
    const [users, sellers, products, orders, paidRevenueAgg] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "seller" }),
      Product.countDocuments(),
      Order.countDocuments(),
      // sum of amount where paymentStatus == "paid"
      Order.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const revenue = paidRevenueAgg[0]?.total ?? 0;
    res.json({ users, sellers, products, orders, revenue });
  } catch (e) { next(e); }
});

/** GET /api/admin/users?role=buyer|seller|admin */
router.get("/users", auth, requireRole("admin"), async (req, res, next) => {
  try {
    const roleQ = (req.query.role as string | undefined)?.trim();
    const { page, limit, skip } = paginate(req.query);

    const where: any = {};
    if (roleQ) where.role = roleQ;

    const [items, total] = await Promise.all([
      User.find(where)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("_id name email role createdAt"),
      User.countDocuments(where),
    ]);

    res.json({
      items: items.map(u => ({ id: String(u._id), name: u.name, email: u.email, role: u.role, createdAt: u.createdAt })),
      page,
      limit,
      total,
    });
  } catch (e) { next(e); }
});

/** PUT /api/admin/users/:id/role */
router.put("/users/:id/role", auth, requireRole("admin"), async (req, res, next) => {
  try {
    const parsed = UpdateUserRole.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "ValidationError", details: parsed.error.flatten() });
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { role: parsed.data.role },
      { new: true, runValidators: true }
    ).select("_id role");

    if (!updated) return res.status(404).json({ error: "User not found" });
    res.json({ id: String(updated._id), role: updated.role });
  } catch (e) { next(e); }
});

/** GET /api/admin/orders?status=&paymentStatus= (paginated) */
router.get("/orders", auth, requireRole("admin"), async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query);

    const where: any = {};
    if (req.query.status) {
      const s = OrderStatusEnum.safeParse(req.query.status);
      if (s.success) where.status = s.data;
    }
    if (req.query.paymentStatus) {
      const p = PaymentStatusEnum.safeParse(req.query.paymentStatus);
      if (p.success) where.paymentStatus = p.data;
    }

    const [items, total] = await Promise.all([
      Order.find(where).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(where),
    ]);

    res.json({ items, page, limit, total });
  } catch (e) { next(e); }
});

/** GET /api/admin/payouts (paginated, includes seller info) */
router.get("/payouts", auth, requireRole("admin"), async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query);

    const [items, total] = await Promise.all([
      Payout.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: "sellerId", select: "_id name email" }),
      Payout.countDocuments(),
    ]);

    // reshape to match prior include.seller
    const shaped = items.map((p) => ({
      _id: p._id,
      sellerId: p.sellerId,
      amount: p.amount,
      status: p.status,
      period: p.period,
      txId: p.txId,
      notes: p.notes,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      seller: p.populated("sellerId")
        ? { id: String((p.sellerId as any)._id), name: (p.sellerId as any).name, email: (p.sellerId as any).email }
        : undefined,
    }));

    res.json({ items: shaped, page, limit, total });
  } catch (e) { next(e); }
});

/** POST /api/admin/payouts */
router.post("/payouts", auth, requireRole("admin"), async (req, res, next) => {
  try {
    const parsed = CreatePayout.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "ValidationError", details: parsed.error.flatten() });
    }

    const seller = await User.findById(parsed.data.sellerId).select("_id role");
    if (!seller || seller.role !== "seller") {
      return res.status(400).json({ error: "Invalid sellerId" });
    }

    const created = await Payout.create({
      sellerId: seller._id,
      amount: parsed.data.amount,
      status: "pending",
    });

    res.status(201).json(created);
  } catch (e) { next(e); }
});

/** PUT /api/admin/payouts/:id */
router.put("/payouts/:id", auth, requireRole("admin"), async (req, res, next) => {
  try {
    const parsed = UpdatePayout.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "ValidationError", details: parsed.error.flatten() });
    }

    const updated = await Payout.findByIdAndUpdate(
      req.params.id,
      { status: parsed.data.status },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Payout not found" });
    res.json(updated);
  } catch (e) { next(e); }
});

export default router;
