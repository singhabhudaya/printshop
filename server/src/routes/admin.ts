
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth, requireRole } from "../middleware/auth.js";

const prisma = new PrismaClient();
const router = Router();

router.get("/sellers", requireAuth, requireRole("admin"), async (_req, res) => {
  const sellers = await prisma.user.findMany({ where: { role: "seller" }, orderBy: { createdAt: "desc" } });
  res.json(sellers.map(s => ({ ...s, password: undefined })));
});

router.get("/orders", requireAuth, requireRole("admin"), async (_req, res) => {
  const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" } });
  res.json(orders);
});

export default router;
