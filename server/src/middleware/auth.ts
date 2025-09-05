
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../utils/env.js";

export interface AuthUser { id: string; role: "buyer"|"seller"|"admin"; sellerTier?: 1|2; }
declare module "express-serve-static-core" { interface Request { user?: AuthUser; } }

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  const token = header.slice(7);
  try { req.user = jwt.verify(token, env.JWT_SECRET) as AuthUser; next(); }
  catch { return res.status(401).json({ error: "Invalid token" }); }
};

export const requireRole = (...roles: AuthUser["role"][]) => (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
  next();
};
