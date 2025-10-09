import { Router } from "express";
import fs from "fs";
import path from "path";

const router = Router();

// ✅ Safely read package.json in CommonJS projects
const pkgPath = path.resolve(__dirname, "../../package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

/**
 * @openapi
 * /api/health:
 *   get:
 *     tags: [System]
 *     summary: Health check
 *     responses:
 *       200:
 *         description: OK
 */
router.get("/", (_req, res) => {
  res.json({
    status: "ok",
    name: pkg.name,
    version: pkg.version,
    time: new Date().toISOString(),
  });
});

export default router;
