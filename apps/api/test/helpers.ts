import "reflect-metadata";
import type { DataSource } from "typeorm";
import { createAppContext, type AppContext } from "../src/config/app-context.js";
import { initializeDataSource } from "../src/config/data-source.js";
import { seedIfEmpty } from "../src/database/seed.js";
import { PasswordService } from "../src/security/password.service.js";
import type { Clock, LocalDateTime } from "../src/shared/clock.js";

export class FixedClock implements Clock {
  constructor(private current: LocalDateTime) {}

  set(next: LocalDateTime): void {
    this.current = next;
  }

  now(): LocalDateTime {
    return this.current;
  }

  timestamp(): string {
    return `${this.current.date}T12:00:00.000Z`;
  }
}

export const ADMIN = { email: "admin@test.cl", password: "ClaveSegura2026!" };

export const MONDAY = "2026-11-02";
export const TUESDAY = "2026-11-03";
export const SATURDAY = "2026-11-07";
export const SUNDAY = "2026-11-08";

export const VALID_CUSTOMER = {
  name: "Ana Pérez",
  rut: "11.111.111-1",
  phone: "9 1234 5678",
  email: "ana@correo.cl"
};

export interface TestContext extends AppContext {
  dataSource: DataSource;
  clock: FixedClock;
}

export async function createTestContext(
  now: LocalDateTime = { date: "2026-10-30", minutes: 9 * 60 }
): Promise<TestContext> {
  const dataSource = await initializeDataSource(":memory:");
  const clock = new FixedClock(now);

  await seedIfEmpty(dataSource, {
    adminEmail: ADMIN.email,
    adminPassword: ADMIN.password,
    passwordService: new PasswordService(),
    clock,
    withSampleBookings: false
  });

  const context = createAppContext({ dataSource, clock, jwtSecret: "x".repeat(40), jwtExpiresIn: "1h" });
  return { ...context, dataSource, clock };
}
