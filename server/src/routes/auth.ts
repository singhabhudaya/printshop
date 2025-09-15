<<<<<<< HEAD
import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { env } from "../utils/env.js";
import { auth } from "../middleware/auth.js";
=======

import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../utils/env.js";
import { requireAuth } from "../middleware/auth.js";
>>>>>>> 4fc21c4de22ed271266fd8959f0f68c8ce9ab743

const prisma = new PrismaClient();
const router = Router();

<<<<<<< HEAD
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
=======
const RegisterDto = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["buyer","seller","admin"]).optional(),
  sellerTier: z.number().int().min(1).max(2).optional(),
});

router.post("/register", async (req, res) => {
  const body = RegisterDto.parse(req.body);
  const exists = await prisma.user.findUnique({ where: { email: body.email } });
  if (exists) return res.status(400).json({ error: "Email already registered" });
  const hash = await bcrypt.hash(body.password, 10);
  const user = await prisma.user.create({
    data: { name: body.name, email: body.email, password: hash, role: body.role ?? "buyer", sellerTier: body.role==="seller" ? (body.sellerTier as 1|2) : null },
  });
  const token = jwt.sign({ id: user.id, role: user.role, sellerTier: user.sellerTier }, env.JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { ...user, password: undefined } });
});

const LoginDto = z.object({ email: z.string().email(), password: z.string() });
router.post("/login", async (req, res) => {
  const body = LoginDto.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user) return res.status(400).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(body.password, user.password);
  if (!ok) return res.status(400).json({ error: "Invalid credentials" });
  const token = jwt.sign({ id: user.id, role: user.role, sellerTier: user.sellerTier }, env.JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { ...user, password: undefined } });
});

router.get("/me", requireAuth, async (req, res) => {
  const me = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!me) return res.status(404).json({ error: "Not found" });
  res.json({ ...me, password: undefined });
>>>>>>> 4fc21c4de22ed271266fd8959f0f68c8ce9ab743
});

export default router;
