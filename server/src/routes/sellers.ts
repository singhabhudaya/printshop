
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";

const prisma = new PrismaClient();
const router = Router();

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
});

export default router;
