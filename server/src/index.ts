// src/index.ts
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

// Render/Cloud proxy awareness (needed for correct IPs, cookies, rate limits)
app.set("trust proxy", 1);

// ----------------------------------
// 1️⃣ CORS (safer + clear logging)
// ----------------------------------
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

console.log("✅ Allowed CORS origins:", allowedOrigins);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests without an Origin header (e.g., curl/Postman, same-origin server calls)
      if (!origin) return cb(null, true);

      if (allowedOrigins.includes(origin)) {
        return cb(null, true);
      }

      console.error(`🚫 CORS blocked request from: ${origin}`);
      cb(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);

// ----------------------------------
// 2️⃣ Middleware
// ----------------------------------
app.use(
  helmet({
    // Your API serves JSON; default helmet CSP is fine, but you can tweak if needed.
  })
);
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
// 5️⃣ Route auto-mount (ESM-safe for dev .ts and prod .js)
// ----------------------------------
// In dev (ts-node/tsx), import.meta.url ends with .ts. In prod, it ends with .js.
// We use that to pick the right extension and construct ESM-safe URLs.
const isTsRuntime = import.meta.url.endsWith(".ts");
const routeExt = isTsRuntime ? ".ts" : ".js";

// Helper to ESM-import a file relative to this module (works in NodeNext)
async function importRoute(relPathWithExt: string) {
  const url = new URL(relPathWithExt, import.meta.url).href;
  return import(url);
}

async function mountRoutes() {
  // Keep these relative to THIS file (index.ts / index.js)
  const routes: Array<{ file: string; mount: string }> = [
    { file: `./routes/auth${routeExt}`, mount: "/api/auth" },
    { file: `./routes/products${routeExt}`, mount: "/api/products" },
    { file: `./routes/categories${routeExt}`, mount: "/api/categories" },
    { file: `./routes/orders${routeExt}`, mount: "/api/orders" },
    { file: `./routes/sellers${routeExt}`, mount: "/api/sellers" },
    { file: `./routes/admin${routeExt}`, mount: "/api/admin" },
  ];

  for (const { file, mount } of routes) {
    try {
      const mod = await importRoute(file);
      if (!mod?.default) {
        throw new Error("Module has no default export (router).");
      }
      app.use(mount, mod.default);
      console.log(`✅ Mounted ${mount} ← ${file}`);
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

    server = app.listen(PORT, () => {
      console.log(`🚀 API running on port ${PORT}`);
    });
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
    if (server) {
      await new Promise<void>((res, rej) =>
        server.close((err) => (err ? rej(err) : res()))
      );
    }
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
