<<<<<<< HEAD
import jwt from "jsonwebtoken";
import { env } from "../utils/env.js";
import { NextFunction, Request, Response } from "express";

export interface JwtUserPayload {
  id: string;
  role: "buyer" | "seller" | "admin";
  email?: string;
  name?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload;
    }
  }
}

export function auth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtUserPayload;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export const requireRole =
  (...roles: JwtUserPayload["role"][]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
    next();
  };
=======

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
>>>>>>> 4fc21c4de22ed271266fd8959f0f68c8ce9ab743
