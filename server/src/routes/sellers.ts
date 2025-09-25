import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { auth, requireRole } from "../middleware/auth.js";

const prisma = new PrismaClient();
const router = Router();

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
});

export default router;
