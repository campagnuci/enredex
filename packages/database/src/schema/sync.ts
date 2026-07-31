import {
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { importSourceEnum, importStatusEnum } from "./enums.js";

/**
 * Audit trail for reference data import runs (packages/pokemon-data).
 * Supports the repeatable, idempotent import pipeline.
 */
export const importRuns = pgTable("import_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: importSourceEnum("source").notNull(),
  version: varchar("version", { length: 100 }),
  status: importStatusEnum("status").notNull().default("running"),
  stats: jsonb("stats").$type<Record<string, number>>(),
  error: text("error"),
  startedAt: timestamp("started_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
});

export type ImportRun = typeof importRuns.$inferSelect;
export type NewImportRun = typeof importRuns.$inferInsert;
