import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

router.get("/", async (_req, res) => {
  const cats = await prisma.category.findMany({ orderBy: { name: "asc" } });
  res.json(cats);
});

export default router;
