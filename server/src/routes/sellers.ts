<<<<<<< HEAD
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { auth, requireRole } from "../middleware/auth.js";
=======

import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
>>>>>>> 4fc21c4de22ed271266fd8959f0f68c8ce9ab743

const prisma = new PrismaClient();
const router = Router();

<<<<<<< HEAD
/** GET /api/sellers/me (seller dashboard snapshot) */
router.get("/me", auth, requireRole("seller", "admin"), async (req, res) => {
  const sellerId = req.user!.role === "admin" ? String(req.query.sellerId || "") : req.user!.id;
  if (!sellerId) return res.status(400).json({ error: "sellerId is required for admin view" });

  const [seller, products, orders, payouts] = await Promise.all([
    prisma.user.findUnique({
      where: { id: sellerId },
      select: { id: true, name: true, email: true, sellerTier: true, role: true }
    }),
    prisma.product.findMany({ where: { sellerId }, orderBy: { createdAt: "desc" } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.payout.findMany({ where: { sellerId }, orderBy: { createdAt: "desc" } })
  ]);

  if (!seller) return res.status(404).json({ error: "Seller not found" });

  // compute gross sales from orders containing this seller's items
  type Item = { price: number; quantity: number; sellerId: string };
  let gross = 0;
  let itemsSold = 0;
  for (const o of orders) {
    const items = (o.items as unknown as Item[]) || [];
    for (const it of items) {
      if (it.sellerId === sellerId) {
        gross += it.price * it.quantity;
        itemsSold += it.quantity;
      }
    }
  }

  res.json({
    seller,
    stats: {
      products: products.length,
      itemsSold,
      gross
    },
    products,
    payouts
  });
});

/** GET /api/sellers/products (seller's own products) */
router.get("/products", auth, requireRole("seller", "admin"), async (req, res) => {
  const sellerId = req.user!.role === "admin" ? String(req.query.sellerId || "") : req.user!.id;
  if (!sellerId) return res.status(400).json({ error: "sellerId is required for admin view" });

  const items = await prisma.product.findMany({
    where: { sellerId },
    orderBy: { createdAt: "desc" }
  });
  res.json(items);
});

/** GET /api/sellers/payouts */
router.get("/payouts", auth, requireRole("seller", "admin"), async (req, res) => {
  const sellerId = req.user!.role === "admin" ? String(req.query.sellerId || "") : req.user!.id;
  if (!sellerId) return res.status(400).json({ error: "sellerId is required for admin view" });

  const items = await prisma.payout.findMany({
    where: { sellerId },
    orderBy: { createdAt: "desc" }
  });
  res.json(items);
=======
router.post("/register", requireAuth, async (req, res) => {
  const body = z.object({ sellerTier: z.number().int().min(1).max(2) }).parse(req.body);
  const user = await prisma.user.update({ where: { id: req.user!.id }, data: { role: "seller", sellerTier: body.sellerTier } });
  res.json({ ...user, password: undefined });
});

router.get("/dashboard", requireAuth, requireRole("seller"), async (req, res) => {
  const [orders, earningsAgg] = await Promise.all([
    prisma.order.findMany({ where: { sellerId: req.user!.id }, orderBy: { createdAt: "desc" } }),
    prisma.order.aggregate({ where: { sellerId: req.user!.id, status: "completed" }, _sum: { amount: true } }),
  ]);
  res.json({ orders, earnings: earningsAgg._sum.amount || 0 });
>>>>>>> 4fc21c4de22ed271266fd8959f0f68c8ce9ab743
});

export default router;
