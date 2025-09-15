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
