import { createDb } from "@enredex/database";
import { syncAll } from "./index.js";
import { config as dotenvConfig } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
dotenvConfig({ path: path.join(root, ".env") });

const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://enredex:enredex@localhost:5432/enredex";

const db = createDb(databaseUrl);
await syncAll(db);
await db.$client.end();
