import type { Express } from "express";

export function registerSwagger(app: Express) {
  try {
    // Dynamically import only when needed
    const swaggerUi = require("swagger-ui-express");
    const swaggerJsdoc = require("swagger-jsdoc");
    const pkg = require("../../package.json");

    const options = {
      definition: {
        openapi: "3.0.3",
        info: {
          title: "Printing Muse API",
          version: pkg.version || "0.1.0",
        },
        servers: [{ url: process.env.BASE_URL || "http://localhost:4000" }],
        components: {
          securitySchemes: {
            bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
          },
        },
        security: [{ bearerAuth: [] }],
      },
      apis: ["src/routes/**/*.ts"],
    };

    const spec = swaggerJsdoc(options);
    app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(spec));
    console.log("📘 Swagger UI available at /api/docs");
  } catch (err) {
    console.log("⚠️ Swagger not enabled (optional dependency missing).");
  }
}
