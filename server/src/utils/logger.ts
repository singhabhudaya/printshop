import pino from "pino";
// In ESM + NodeNext, pino-http's typing can appear as a module object.
// Use createRequire to load the CJS export safely.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const pinoHttp: any = require("pino-http");

export const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
});

// pinoHttp may be default-exported or direct—normalize it to a callable
const pinoHttpFn: any = (pinoHttp && pinoHttp.default) ? pinoHttp.default : pinoHttp;

export const httpLogger = pinoHttpFn({
  logger,
  autoLogging: process.env.NODE_ENV !== "test",
});
