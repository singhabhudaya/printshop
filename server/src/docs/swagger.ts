import type { Express } from "express";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import pkg from "../../package.json" with { type: "json" };

export function registerSwagger(app: Express) {
  const options = {
    definition: {
      openapi: "3.0.3",
      info: {
        title: "Printing Muse API",
        version: pkg.version || "0.1.0",
      },
      servers: [{ url: "http://localhost:4000" }],
      components: {
        securitySchemes: {
          bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    // Scan route files for @openapi blocks
    apis: ["src/routes/**/*.ts", "src/docs/**/*.yml"],
  };

  // swagger-jsdoc returns `object`; cast so TS lets us set/read `paths`
  const spec = swaggerJsdoc(options) as any;

  // Fallback so the UI isn't empty even if no route has JSDoc yet
  if (!spec.paths || Object.keys(spec.paths).length === 0) {
    spec.paths = {
      "/api/health": {
        get: {
          tags: ["System"],
          summary: "Health check",
          responses: { "200": { description: "OK" } },
        },
      },
    };
  }

  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(spec, { explorer: true }));
}
