import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import { httpLogger } from "./utils/logger.js";
import { registerSwagger } from "./docs/swagger.js";

const app = express();
const PORT = Number(process.env.PORT || 4000);

/** CORS */
const origins = (process.env.CORS_ORIGIN || "")
  .split(",").map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (origins.length === 0 || origins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked: ${origin}`));
  }
}));

/** Security & utils */
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(rateLimit({ windowMs: 60_000, limit: 100 }));
app.use(httpLogger);

/** Static */
app.use("/uploads", express.static("uploads"));

/** Root & Health */
app.get("/", (_req, res) => {
  res.status(200).json({ name: "Printing Muse API", health: "/api/health", docs: "/api/docs" });
});
app.get("/api/health", (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

/** Swagger */
registerSwagger(app);

/** Try to mount routes dynamically (skip ones that error due to Prisma) */
async function safeMount(path: string, mount: string) {
  try {
    const mod = await import(path);
    app.use(mount, mod.default);
    console.log(`✅ Mounted ${mount} from ${path}`);
  } catch (e) {
    console.warn(`⚠️ Skipped ${mount} (${path}) — ${String((e as Error).message).slice(0,120)}...`);
  }
}

async function mountRoutes() {
  await safeMount("./routes/auth.js", "/api/auth");
  await safeMount("./routes/products.js", "/api/products");
  await safeMount("./routes/categories.js", "/api/categories");
  await safeMount("./routes/orders.js", "/api/orders");
  await safeMount("./routes/sellers.js", "/api/sellers");
  await safeMount("./routes/admin.js", "/api/admin");
}

/** Boot */
let server: import("http").Server;

async function start() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("❌ MONGO_URI missing in .env");
    process.exit(1);
  }
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log("✅ MongoDB connected");

  await mountRoutes();

  server = app.listen(PORT, () => console.log(`🚀 API http://localhost:${PORT}`));
}

start().catch((e) => {
  console.error("❌ Startup error:", e);
  process.exit(1);
});

/** Graceful shutdown */
async function shutdown(signal: string) {
  try {
    console.log(`\n${signal} received. Closing server...`);
    if (server) await new Promise<void>((r, j) => server.close(err => err ? j(err) : r()));
    await mongoose.connection.close();
    console.log("✅ Clean shutdown");
    process.exit(0);
  } catch (e) {
    console.error("❌ Error during shutdown:", e);
    process.exit(1);
  }
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
