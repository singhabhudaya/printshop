
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { requireAuth, requireRole } from "../middleware/auth.js";

const prisma = new PrismaClient();
const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(process.cwd(), "uploads")),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

router.get("/", async (req, res) => {
  const categoryId = typeof req.query.categoryId === "string" ? req.query.categoryId : undefined;
  const products = await prisma.product.findMany({ where: { categoryId }, orderBy: { createdAt: "desc" } });
  res.json(products);
});

router.get("/featured", async (_req, res) => {
  const [trending, bestSellers, newArrivals] = await Promise.all([
    prisma.product.findMany({ take: 10, orderBy: { createdAt: "desc" } }),
    prisma.product.findMany({ take: 10, orderBy: { price: "asc" } }),
    prisma.product.findMany({ take: 10, orderBy: { createdAt: "desc" } }),
  ]);
  res.json({ trending, bestSellers, newArrivals });
});

router.get("/:id", async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) return res.status(404).json({ error: "Not found" });
  res.json(product);
});

const CreateProductDto = z.object({
  title: z.string().min(2),
  price: z.number().positive(),
  images: z.array(z.string()).default([]),
  categoryId: z.string().optional(),
});

router.post("/", requireAuth, requireRole("seller","admin"), upload.single("stl"), async (req, res) => {
  const body = CreateProductDto.parse(JSON.parse(req.body.data));
  const stlFile = req.file ? `/uploads/${req.file.filename}` : null;
  const product = await prisma.product.create({
    data: { title: body.title, price: body.price, images: body.images, stlFile, sellerId: req.user!.id, categoryId: body.categoryId },
  });
  res.json(product);
});

export default router;
