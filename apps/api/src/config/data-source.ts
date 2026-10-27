import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DataSource } from "typeorm";
import { AdminUser } from "../models/admin-user.model.js";
import { Appointment } from "../models/appointment.model.js";
import { Barber } from "../models/barber.model.js";
import { Service } from "../models/service.model.js";
import { SnakeNamingStrategy } from "./snake-naming.strategy.js";

export const ENTITIES = [Barber, Service, Appointment, AdminUser];

export function createDataSource(databasePath: string): DataSource {
  if (databasePath !== ":memory:") mkdirSync(dirname(databasePath), { recursive: true });

  return new DataSource({
    type: "better-sqlite3",
    database: databasePath,
    entities: ENTITIES,
    namingStrategy: new SnakeNamingStrategy(),
    synchronize: true,
    enableWAL: databasePath !== ":memory:",
    prepareDatabase: (db) => {
      db.pragma("foreign_keys = ON");
      db.pragma("busy_timeout = 5000");
    }
  });
}

export async function initializeDataSource(databasePath: string): Promise<DataSource> {
  return createDataSource(databasePath).initialize();
}
