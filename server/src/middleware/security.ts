import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { Express } from "express";

export function applySecurity(app: Express) {
  app.use(helmet());
  app.use(compression());

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300, // requests per 15 minutes per IP
    standardHeaders: true,
    legacyHeaders: false
  });

  app.use(limiter);
}
