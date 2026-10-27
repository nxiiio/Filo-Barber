import "reflect-metadata";
import type { SignOptions } from "jsonwebtoken";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { createAppContext } from "./config/app-context.js";
import { initializeDataSource } from "./config/data-source.js";
import { loadEnv } from "./config/env.js";
import { seedIfEmpty } from "./database/seed.js";
import { PasswordService } from "./security/password.service.js";
import { ZonedClock } from "./shared/clock.js";

const env = loadEnv();
const clock = new ZonedClock(env.TIME_ZONE);
const dataSource = await initializeDataSource(env.DATABASE_PATH);

await seedIfEmpty(dataSource, {
  adminEmail: env.ADMIN_EMAIL,
  adminPassword: env.ADMIN_PASSWORD,
  passwordService: new PasswordService(),
  clock
});

const context = createAppContext({
  dataSource,
  clock,
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"]
});

const app = createApp(context, {
  webDistPath: fileURLToPath(new URL("../../web/dist", import.meta.url))
});

const server = app.listen(env.PORT, () => {
  console.log(`Filo Barbería escuchando en http://localhost:${env.PORT}`);
});

function shutdown(): void {
  server.close(() => {
    void dataSource.destroy().finally(() => process.exit(0));
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
