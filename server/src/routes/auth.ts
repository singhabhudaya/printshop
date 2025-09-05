
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../utils/env.js";
import { requireAuth } from "../middleware/auth.js";

const prisma = new PrismaClient();
const router = Router();

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
});

export default router;
