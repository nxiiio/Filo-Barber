import "reflect-metadata";
import { rmSync } from "node:fs";
import { initializeDataSource } from "../config/data-source.js";
import { loadEnv } from "../config/env.js";
import { PasswordService } from "../security/password.service.js";
import { ZonedClock } from "../shared/clock.js";
import { seedIfEmpty } from "./seed.js";

const env = loadEnv();

for (const suffix of ["", "-wal", "-shm"]) {
  rmSync(`${env.DATABASE_PATH}${suffix}`, { force: true });
}

const dataSource = await initializeDataSource(env.DATABASE_PATH);
await seedIfEmpty(dataSource, {
  adminEmail: env.ADMIN_EMAIL,
  adminPassword: env.ADMIN_PASSWORD,
  passwordService: new PasswordService(),
  clock: new ZonedClock(env.TIME_ZONE)
});
await dataSource.destroy();

console.log(`Base de datos reiniciada en ${env.DATABASE_PATH}`);
