import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { connectMongo } from "./db";
import { registerSwagger } from "./docs/swagger";
import { httpLogger } from "./utils/logger";

// ⬇️ static route imports (no dynamic import/meta)
import authRouter from "./routes/auth";
import productsRouter from "./routes/products";
import categoriesRouter from "./routes/categories";
import ordersRouter from "./routes/orders";
import sellersRouter from "./routes/sellers";
import adminRouter from "./routes/admin";

const app = express();
const PORT = Number(process.env.PORT || 4000);

// Make proxies (Render/Cloudflare) play nice for IPs/cookies/rate limits
app.set("trust proxy", 1);

// ----------------------------------
// 1️⃣ CORS (env-driven + clear logs)
// ----------------------------------
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

console.log("✅ Allowed CORS origins:", allowedOrigins);

app.use(
  cors({
    origin: (origin, cb) => {
      // allow curl/Postman or server-to-server (no Origin header)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      console.error(`🚫 CORS blocked request from: ${origin}`);
      cb(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);

// ----------------------------------
// 2️⃣ Middleware
// ----------------------------------
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(rateLimit({ windowMs: 60_000, limit: 100 }));
app.use(httpLogger);

// ----------------------------------
// 3️⃣ Static + Health routes
// ----------------------------------
app.use("/uploads", express.static("uploads"));

app.get("/", (_req, res) => {
  res.status(200).json({
    name: "Printing Muse API",
    health: "/api/health",
    docs: "/api/docs",
  });
});

app.get("/api/health", (_req, res) =>
  res.json({ ok: true, ts: new Date().toISOString() })
);

// ----------------------------------
// 4️⃣ Swagger (optional)
// ----------------------------------
registerSwagger(app);

// ----------------------------------
// 5️⃣ Routes (static mounts = bulletproof)
// ----------------------------------
console.log("⛓ Mounting routes...");
app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/sellers", sellersRouter);
app.use("/api/admin", adminRouter);
console.log("✅ Routes mounted");

// ----------------------------------
// 6️⃣ Boot sequence
// ----------------------------------
let server: import("http").Server;

async function start() {
  try {
    await connectMongo();
    server = app.listen(PORT, () =>
      console.log(`🚀 API running on port ${PORT}`)
    );
  } catch (err) {
    console.error("❌ Startup failed:", err);
    process.exit(1);
  }
}

start();

// ----------------------------------
// 7️⃣ Graceful shutdown
// ----------------------------------
async function shutdown(signal: string) {
  console.log(`\n${signal} received. Closing...`);
  try {
    if (server)
      await new Promise<void>((res, rej) =>
        server.close((err) => (err ? rej(err) : res()))
      );
    await import("mongoose").then((m) => m.default.connection.close());
    console.log("✅ Clean shutdown");
    process.exit(0);
  } catch (e) {
    console.error("❌ Error during shutdown:", e);
    process.exit(1);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
