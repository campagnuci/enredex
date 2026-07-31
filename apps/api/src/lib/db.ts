import type { Database } from "@enredex/database";
import { errors } from "./errors.js";

export type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];
export type DbOrTx = Database | Tx;

interface PgErrorInfo {
  code: string;
  constraint?: string;
}

/**
 * Unwraps drizzle's DrizzleQueryError chain to find the underlying
 * node-postgres error (5-char SQLSTATE code).
 */
export function getPgErrorInfo(e: unknown): PgErrorInfo | undefined {
  let cur: unknown = e;
  while (cur && typeof cur === "object") {
    const code = (cur as { code?: unknown }).code;
    if (typeof code === "string" && /^\d{5}$/.test(code)) {
      return {
        code,
        constraint: (cur as { constraint?: string }).constraint,
      };
    }
    cur = (cur as { cause?: unknown }).cause;
  }
  return undefined;
}

/** Maps Postgres constraint violations to HTTP errors; rethrows anything else. */
export function mapPgError(e: unknown): never {
  const pg = getPgErrorInfo(e);
  if (pg?.code === "23505") {
    switch (pg.constraint) {
      case "users_email_unique":
        throw errors.conflict("Email is already registered");
      case "pokemon_box_slot_unique":
        throw errors.conflict("That box slot is already occupied");
      case "boxes_user_position_unique":
        throw errors.conflict("A box already exists at that position");
      case "original_trainers_user_game_name_tid_unique":
        throw errors.conflict("This OT is already in your library");
      default:
        throw errors.conflict("Duplicate value violates a unique constraint");
    }
  }
  if (pg?.code === "23503") {
    throw errors.badRequest("Invalid reference: related record does not exist");
  }
  if (pg?.code === "23514") {
    throw errors.badRequest("Value violates a database constraint");
  }
  throw e;
}
