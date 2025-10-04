import { Router } from "express";
import { Category } from "../models/Category.js";
import { auth, requireRole } from "../middleware/auth.js";

const router = Router();

/** tiny slugify without deps */
function slugify(input: string) {
  return String(input)
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** GET /api/categories */
router.get("/", async (req, res, next) => {
  try {
    const { q, page = "1", limit = "50", sort = "name" } = req.query as any;

    const query: any = {};
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { slug: { $regex: q, $options: "i" } },
      ];
    }

    const sortMap: Record<string, any> = { name: { name: 1 }, newest: { createdAt: -1 } };
    const sortBy = sortMap[sort] ?? { name: 1 };

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Category.find(query).sort(sortBy).skip(skip).limit(limitNum),
      Category.countDocuments(query),
    ]);

    res.json({ items, total, page: pageNum, limit: limitNum });
  } catch (e) { next(e); }
});

/** GET /api/categories/:id */
router.get("/:id", async (req, res, next) => {
  try {
    const doc = await Category.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (e) { next(e); }
});

/** POST /api/categories  (admin) */
router.post("/", auth, requireRole("admin"), async (req, res, next) => {
  try {
    const { name, slug } = req.body as { name: string; slug?: string };
    if (!name) return res.status(400).json({ error: "Name required" });

    const finalSlug = slug ? slugify(slug) : slugify(name);
    const exists = await Category.findOne({ slug: finalSlug });
    if (exists) return res.status(409).json({ error: "Slug already exists" });

    const doc = await Category.create({ name: name.trim(), slug: finalSlug });
    res.status(201).json(doc);
  } catch (e) { next(e); }
});

/** PUT /api/categories/:id  (admin) */
router.put("/:id", auth, requireRole("admin"), async (req, res, next) => {
  try {
    const updates: any = {};
    if (req.body.name) updates.name = String(req.body.name).trim();
    if (req.body.slug) updates.slug = slugify(req.body.slug);

    if (updates.slug) {
      const clash = await Category.findOne({ slug: updates.slug, _id: { $ne: req.params.id } });
      if (clash) return res.status(409).json({ error: "Slug already exists" });
    }

    const doc = await Category.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (e) { next(e); }
});

/** DELETE /api/categories/:id  (admin) */
router.delete("/:id", auth, requireRole("admin"), async (req, res, next) => {
  try {
    const del = await Category.findByIdAndDelete(req.params.id);
    if (!del) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;   // <<< IMPORTANT
