import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { connectMongo } from "./db";
import { registerSwagger } from "./docs/swagger";
import { httpLogger } from "./utils/logger";

const app = express();
const PORT = Number(process.env.PORT || 4000);

// ----------------------------------
// 1️⃣ CORS
// ----------------------------------
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS blocked: ${origin}`));
    },
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
// 5️⃣ Route auto-mount
// ----------------------------------
async function mountRoutes() {
  const routes = [
    ["./routes/auth", "/api/auth"],
    ["./routes/products", "/api/products"],
    ["./routes/categories", "/api/categories"],
    ["./routes/orders", "/api/orders"],
    ["./routes/sellers", "/api/sellers"],
    ["./routes/admin", "/api/admin"],
  ];

  for (const [path, mount] of routes) {
    try {
      const mod = await import(path);
      app.use(mount, mod.default);
      console.log(`✅ Mounted ${mount}`);
    } catch (e) {
      console.warn(`⚠️ Skipped ${mount}: ${(e as Error).message}`);
    }
  }
}

// ----------------------------------
// 6️⃣ Boot sequence
// ----------------------------------
let server: import("http").Server;

async function start() {
  try {
    await connectMongo();
    await mountRoutes();

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
    if (server) await new Promise<void>((res, rej) => server.close(err => err ? rej(err) : res()));
    await import("mongoose").then(m => m.default.connection.close());
    console.log("✅ Clean shutdown");
    process.exit(0);
  } catch (e) {
    console.error("❌ Error during shutdown:", e);
    process.exit(1);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
