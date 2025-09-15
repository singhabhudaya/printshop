import { AnyZodObject } from "zod";
import { Request, Response, NextFunction } from "express";

export function validate(schema: { body?: AnyZodObject; params?: AnyZodObject; query?: AnyZodObject }) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) req.body = schema.body.parse(req.body);
      if (schema.params) req.params = schema.params.parse(req.params);
      if (schema.query) req.query = schema.query.parse(req.query);
      next();
    } catch (e: any) {
      return res.status(400).json({ error: "ValidationError", details: e.errors || e.message });
    }
  };
}
