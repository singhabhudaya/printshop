import { Router } from "express";
import { Subscriber } from "../models/Subscriber.js";

const router = Router();

// POST /api/newsletter/subscribe
router.post("/subscribe", async (req, res, next) => {
  try {
    const { email, source, tags } = req.body as { email: string; source?: string; tags?: string[] };
    if (!email) return res.status(400).json({ error: "Email required" });

    const up = await Subscriber.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      {
        $setOnInsert: { email: email.toLowerCase().trim() },
        $set: { source: source || "web" },
        $addToSet: { tags: { $each: tags || [] } }
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ ok: true, id: up._id });
  } catch (e) { next(e); }
});

// GET /api/newsletter/list  (simple listing)
router.get("/list", async (_req, res, next) => {
  try {
    const items = await Subscriber.find().sort({ createdAt: -1 }).limit(1000);
    res.json({ items, total: items.length });
  } catch (e) { next(e); }
});

export default router;
