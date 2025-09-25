import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { auth, requireRole } from "../middleware/auth.js";

const prisma = new PrismaClient();
const router = Router();

const UpsertCategory = z.object({
  name: z.string().min(2),
  image: z.string().url().optional().or(z.literal("").transform(() => undefined))
});

/** GET /api/categories - list all categories */
router.get("/", async (_req, res) => {
  const cats = await prisma.category.findMany({
    orderBy: { name: "asc" }
  });
  res.json(cats);
});

/** POST /api/categories - create (admin only) */
router.post("/", auth, requireRole("admin"), async (req, res) => {
  const parse = UpsertCategory.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "ValidationError", details: parse.error.flatten() });

  const { name, image } = parse.data;
  const exists = await prisma.category.findUnique({ where: { name } });
  if (exists) return res.status(409).json({ error: "Category already exists" });

  const cat = await prisma.category.create({ data: { name, image } });
  res.status(201).json(cat);
});

/** PUT /api/categories/:id - update (admin only) */
router.put("/:id", auth, requireRole("admin"), async (req, res) => {
  const parse = UpsertCategory.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "ValidationError", details: parse.error.flatten() });

  const id = req.params.id;
  try {
    const updated = await prisma.category.update({
      where: { id },
      data: parse.data
    });
    res.json(updated);
  } catch {
    res.status(404).json({ error: "Category not found" });
  }
});

/** DELETE /api/categories/:id - delete (admin only) */
router.delete("/:id", auth, requireRole("admin"), async (req, res) => {
  const id = req.params.id;
  try {
    await prisma.category.delete({ where: { id } });
    res.status(204).send();
  } catch (e: any) {
    // likely due to foreign key constraint if products reference this category
    res.status(400).json({ error: "Cannot delete category in use" });
  }
});

export default router;
