
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";

const prisma = new PrismaClient();
const router = Router();

router.post("/create", requireAuth, async (req, res) => {
  const body = z.object({ productId: z.string(), amount: z.number().positive() }).parse(req.body);
  const product = await prisma.product.findUnique({ where: { id: body.productId } });
  if (!product) return res.status(404).json({ error: "Product not found" });
  const order = await prisma.order.create({
    data: { productId: product.id, buyerId: req.user!.id, amount: body.amount, status: "created", paymentStatus: "pending" },
  });
  res.json(order);
});

router.post("/assign", requireAuth, requireRole("admin"), async (req, res) => {
  const body = z.object({ orderId: z.string(), sellerId: z.string() }).parse(req.body);
  const order = await prisma.order.update({ where: { id: body.orderId }, data: { sellerId: body.sellerId, status: "assigned" } });
  res.json(order);
});

router.post("/update-status", requireAuth, async (req, res) => {
  const body = z.object({ orderId: z.string(), status: z.enum(["created","assigned","in_progress","completed","cancelled"]) }).parse(req.body);
  const existing = await prisma.order.findUnique({ where: { id: body.orderId } });
  if (!existing) return res.status(404).json({ error: "Not found" });
  if (req.user!.role === "seller" && existing.sellerId !== req.user!.id) return res.status(403).json({ error: "Forbidden" });
  const order = await prisma.order.update({ where: { id: body.orderId }, data: { status: body.status } });
  res.json(order);
});

export default router;
