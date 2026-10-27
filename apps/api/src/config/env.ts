import { z } from "zod";

try {
  process.loadEnvFile();
} catch {
  // Sin archivo .env: se usan las variables del entorno o los valores por defecto.
}

const DEV_SECRET = "dev-only-secret-change-me-before-deploying";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_PATH: z.string().min(1).default("./data/filo.db"),
  JWT_SECRET: z.string().min(32).default(DEV_SECRET),
  JWT_EXPIRES_IN: z.string().default("8h"),
  ADMIN_EMAIL: z.email().default("admin@filobarberia.cl"),
  ADMIN_PASSWORD: z.string().min(10).default("FiloAdmin2026!"),
  TIME_ZONE: z.string().default("America/Santiago")
});

export type Env = z.infer<typeof schema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const env = schema.parse(source);
  if (env.NODE_ENV === "production" && env.JWT_SECRET === DEV_SECRET) {
    throw new Error("JWT_SECRET debe configurarse en producción");
  }
  return env;
}
