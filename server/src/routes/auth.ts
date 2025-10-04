import { Router } from "express";
import bcrypt from "bcrypt";
import { User } from "../models/User.js";
import { signJwt } from "../utils/jwt.js";
import { auth } from "../middleware/auth.js";

const router = Router();

/** POST /api/auth/register */
router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body as { name: string; email: string; password: string };
    if (!name || !email || !password) return res.status(400).json({ error: "Missing fields" });

    const emailNorm = email.toLowerCase().trim();
    const exists = await User.findOne({ email: emailNorm });
    if (exists) return res.status(409).json({ error: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email: emailNorm, passwordHash, role: "buyer" });

    const token = signJwt({ id: String(user._id), role: user.role, email: user.email, name: user.name });
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (e) { next(e); }
});

/** POST /api/auth/login */
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const user = await User.findOne({ email: (email || "").toLowerCase().trim() });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signJwt({ id: String(user._id), role: user.role, email: user.email, name: user.name });
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (e) { next(e); }
});

/** GET /api/auth/me */
router.get("/me", auth, async (req, res, next) => {
  try {
    const me = await User.findById(req.user!.id).select("name email role createdAt updatedAt");
    if (!me) return res.status(404).json({ error: "Not found" });
    res.json({ user: { id: me._id, name: me.name, email: me.email, role: me.role, createdAt: me.createdAt, updatedAt: me.updatedAt } });
  } catch (e) { next(e); }
});

export default router;
