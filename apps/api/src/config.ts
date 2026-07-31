import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as dotenvConfig } from "dotenv";
import { z } from "zod";

// Load the monorepo root .env (does not override already-set variables)
const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
dotenvConfig({ path: path.join(rootDir, ".env") });

const configSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  WEB_URL: z.url().default("http://localhost:5173"),
  SMTP_URL: z.string().optional(),
  EMAIL_FROM: z.string().default("Enredex <no-reply@enredex.local>"),
});

export type AppConfig = z.infer<typeof configSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return configSchema.parse(env);
}
