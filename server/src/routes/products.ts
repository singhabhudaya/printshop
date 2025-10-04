import { Router } from "express";
import { Product } from "../models/Product.js";

const router = Router();

// GET /api/products
router.get("/", async (req, res, next) => {
  try {
    const { q, minPrice, maxPrice, sellerId, page = "1", limit = "20", sort = "newest" } = req.query as any;

    const query: any = {};
    if (sellerId) query.sellerId = sellerId;
    if (minPrice || maxPrice) {
      query.price = {
        ...(minPrice ? { $gte: +minPrice } : {}),
        ...(maxPrice ? { $lte: +maxPrice } : {}),
      };
    }
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    const sortMap: Record<string, any> = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      newest: { createdAt: -1 },
    };
    const sortBy = sortMap[sort] ?? { createdAt: -1 };

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Product.find(query).sort(sortBy).skip(skip).limit(limitNum),
      Product.countDocuments(query),
    ]);

    res.json({ items, total, page: pageNum, limit: limitNum });
  } catch (e) { next(e); }
});

// POST /api/products
router.post("/", async (req, res, next) => {
  try {
    const body = req.body;
    const doc = await Product.create({
      title: body.title,
      description: body.description ?? "",
      price: body.price,
      images: body.images ?? [],
      categoryId: body.categoryId ?? null,
      sellerId: body.sellerId ?? null, // or req.user?.id if you have auth middleware
    });
    res.status(201).json(doc);
  } catch (e) { next(e); }
});

// PUT /api/products/:id
router.put("/:id", async (req, res, next) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (e) { next(e); }
});

// DELETE /api/products/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const del = await Product.findByIdAndDelete(req.params.id);
    if (!del) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
