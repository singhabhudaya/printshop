<<<<<<< HEAD
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { httpLogger } from "./utils/logger.js";

import healthRouter from "./routes/health.js";
import authRouter from "./routes/auth.js";
import productsRouter from "./routes/products.js";
import categoriesRouter from "./routes/categories.js";
import ordersRouter from "./routes/orders.js";
import sellersRouter from "./routes/sellers.js";
import adminRouter from "./routes/admin.js";

import { registerSwagger } from "./docs/swagger.js";

const app = express();
const PORT = Number(process.env.PORT || 4000);

// security & utils
app.use(helmet());
app.use(compression());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? "*", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(rateLimit({ windowMs: 60_000, limit: 100 }));
app.use(httpLogger);

// static uploads
app.use("/uploads", express.static("uploads"));

// root
app.get("/", (_req, res) => {
  res.status(200).json({ name: "Printing Muse API", health: "/api/health", docs: "/api/docs" });
});

// API routes
app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/sellers", sellersRouter);
app.use("/api/admin", adminRouter);

// Swagger
registerSwagger(app);

// 404
app.use((_req, res) => res.status(404).json({ error: "NotFound" }));

app.listen(PORT, () => console.log(`API http://localhost:${PORT}`));
=======
import express from "express";
import cors from "cors";
import path from "path";
import { env } from "./utils/env.js";
import { errorHandler } from "./middleware/error.js";

import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import sellerRoutes from "./routes/sellers.js";
import adminRoutes from "./routes/admin.js";
import categoryRoutes from "./routes/categories.js"; // ← new

const app = express();

/** core middleware */
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/** static files (uploads) */
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

/** health check */
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, env: env.NODE_ENV ?? "development" });
});

/** api routes */
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/sellers", sellerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/categories", categoryRoutes); // ← new

/** error handler (last) */
app.use(errorHandler);

/** start server */
app.listen(env.PORT, () => {
  console.log(`API http://localhost:${env.PORT}`);
});
>>>>>>> 4fc21c4de22ed271266fd8959f0f68c8ce9ab743
