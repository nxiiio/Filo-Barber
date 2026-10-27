import compression from "compression";
import express, { type Express } from "express";
import helmet from "helmet";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { AppContext } from "./config/app-context.js";
import { createErrorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { createApiRouter } from "./routes/index.js";

export interface AppOptions {
  webDistPath?: string;
  logErrors?: boolean;
}

function serveWebApp(app: Express, distPath: string): void {
  app.use(
    "/assets",
    express.static(join(distPath, "assets"), { immutable: true, maxAge: "1y", fallthrough: false })
  );
  app.use(express.static(distPath, { index: false, maxAge: "1h" }));
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(join(distPath, "index.html"));
  });
}

export function createApp(context: AppContext, options: AppOptions = {}): Express {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(compression());
  app.use(express.json({ limit: "20kb" }));

  app.use("/api", createApiRouter(context.controllers, context.services.auth));

  if (options.webDistPath && existsSync(join(options.webDistPath, "index.html"))) {
    serveWebApp(app, options.webDistPath);
  }

  app.use(notFoundHandler);
  app.use(createErrorHandler(options.logErrors ?? true));

  return app;
}
