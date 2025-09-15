<<<<<<< HEAD
import { NextFunction, Request, Response } from "express";

=======

import { NextFunction, Request, Response } from "express";
>>>>>>> 4fc21c4de22ed271266fd8959f0f68c8ce9ab743
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  res.status(err?.status || 500).json({ error: err?.message || "Server error" });
}
