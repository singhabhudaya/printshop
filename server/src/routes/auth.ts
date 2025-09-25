import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { env } from "../utils/env.js";
import { auth } from "../middleware/auth.js";

const prisma = new PrismaClient();
const router = Router();

const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["buyer", "seller"]).optional().default("buyer")
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

function signToken(user: { id: string; role: "buyer" | "seller" | "admin"; email?: string; name?: string }) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email, name: user.name },
    env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

/** POST /api/auth/register */
router.post("/register", async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "ValidationError", details: parsed.error.flatten() });
  }
  const { name, email, password, role } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ error: "Email already in use" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role }
  });

  const token = signToken(user);
  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});

/** POST /api/auth/login */
router.post("/login", async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "ValidationError", details: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signToken(user);
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});

/** GET /api/auth/me (requires auth) */
router.get("/me", auth, async (req, res) => {
  const me = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, name: true, email: true, role: true }
  });
  res.json({ user: me });
});

export default router;
