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
