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
