import { Router } from "express";
import pkg from "../../package.json" with { type: "json" };

const router = Router();

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
