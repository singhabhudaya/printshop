import pino from "pino";
import pinoHttp from "pino-http";

// Create main logger
export const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  transport:
    process.env.NODE_ENV === "production"
      ? undefined
      : {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
});

// Create HTTP logger middleware
export const httpLogger = pinoHttp({
  logger,
  autoLogging: process.env.NODE_ENV !== "test",
});
