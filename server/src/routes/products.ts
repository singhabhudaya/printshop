<<<<<<< HEAD
=======

>>>>>>> 4fc21c4de22ed271266fd8959f0f68c8ce9ab743
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import multer from "multer";
import path from "path";
<<<<<<< HEAD
import { auth, requireRole } from "../middleware/auth.js";
=======
import { requireAuth, requireRole } from "../middleware/auth.js";
>>>>>>> 4fc21c4de22ed271266fd8959f0f68c8ce9ab743

const prisma = new PrismaClient();
const router = Router();

<<<<<<< HEAD
/** ---------- uploads (multer) ---------- */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(process.cwd(), "uploads")),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "-").toLowerCase();
    cb(null, `${Date.now()}-${base}${ext}`);
  }
});
const upload = multer({ storage });

/** ---------- validation ---------- */
const ProductCreate = z.object({
  title: z.string().min(2),
  description: z.string().min(2).optional().default(""),
  price: z.number().finite().nonnegative(),
  images: z.array(z.string()).optional().default([]),
  categoryId: z.string().optional()
});

const ProductUpdate = z.object({
  title: z.string().min(2).optional(),
  description: z.string().min(2).optional(),
  price: z.number().finite().nonnegative().optional(),
  images: z.array(z.string()).optional(),
  categoryId: z.string().optional()
});

type CreateInput = z.infer<typeof ProductCreate>;
type UpdateInput = z.infer<typeof ProductUpdate>;

/** ---------- helpers ---------- */
function parsePagination(query: any) {
  const page = Math.max(1, Number(query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? 20)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/** ---------- routes ---------- */

/** GET /api/products
 *  Query:
 *   - q, categoryId, sellerId, minPrice, maxPrice
 *   - sort: "price_asc" | "price_desc" | "newest"
 *   - page, limit
 */
router.get("/", async (req, res) => {
  const { q, categoryId, sellerId, minPrice, maxPrice, sort } = req.query as Record<string, string>;
  const { limit, skip, page } = parsePagination(req.query);

  const where: any = {};
  if (q) where.OR = [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }];
  if (categoryId) where.categoryId = categoryId;
  if (sellerId) where.sellerId = sellerId;
  if (minPrice) where.price = { ...(where.price || {}), gte: Number(minPrice) };
  if (maxPrice) where.price = { ...(where.price || {}), lte: Number(maxPrice) };

  let orderBy: any = { createdAt: "desc" };
  if (sort === "price_asc") orderBy = { price: "asc" };
  if (sort === "price_desc") orderBy = { price: "desc" };
  if (sort === "newest") orderBy = { createdAt: "desc" };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      take: limit,
      skip,
      include: {
        category: true,
        seller: { select: { id: true, name: true } }
      }
    }),
    prisma.product.count({ where })
  ]);

  res.json({
    page,
    limit,
    total,
    items
  });
});

/** GET /api/products/:id */
router.get("/:id", async (req, res) => {
  const id = req.params.id;
  const p = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      seller: { select: { id: true, name: true } }
    }
  });
  if (!p) return res.status(404).json({ error: "Not found" });
  res.json(p);
});

/** POST /api/products (seller or admin) — JSON body (images optional) */
router.post("/", auth, requireRole("seller", "admin"), async (req, res) => {
  const parsed = ProductCreate.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "ValidationError", details: parsed.error.flatten() });

  const data: CreateInput = parsed.data;
  const product = await prisma.product.create({
    data: {
      title: data.title,
      description: data.description,
      price: data.price,
      images: data.images ?? [],
      categoryId: data.categoryId ?? null,
      sellerId: req.user!.id
    }
  });

  res.status(201).json(product);
});

/** POST /api/products/upload (seller or admin) — multipart/form-data with images[] */
router.post("/upload", auth, requireRole("seller", "admin"), upload.array("images", 10), async (req, res) => {
  const files = (req.files as Express.Multer.File[]) || [];
  const urls = files.map((f) => `/uploads/${f.filename}`);
  res.status(201).json({ uploaded: urls });
});

/** PUT /api/products/:id (owner seller or admin) */
router.put("/:id", auth, requireRole("seller", "admin"), async (req, res) => {
  const id = req.params.id;
  const parsed = ProductUpdate.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "ValidationError", details: parsed.error.flatten() });

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: "Not found" });

  // if seller, ensure ownership
  if (req.user!.role === "seller" && existing.sellerId !== req.user!.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const updated = await prisma.product.update({
    where: { id },
    data: parsed.data
  });
  res.json(updated);
});

/** DELETE /api/products/:id (owner seller or admin) */
router.delete("/:id", auth, requireRole("seller", "admin"), async (req, res) => {
  const id = req.params.id;
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: "Not found" });

  if (req.user!.role === "seller" && existing.sellerId !== req.user!.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  await prisma.product.delete({ where: { id } });
  res.status(204).send();
=======
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
>>>>>>> 4fc21c4de22ed271266fd8959f0f68c8ce9ab743
});

export default router;
