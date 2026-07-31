import { history, type HistoryAction } from "@enredex/database";
import type { DbOrTx } from "./db.js";

export function recordHistory(
  db: DbOrTx,
  entry: {
    userId: string;
    pokemonId?: string | null;
    action: HistoryAction;
    summary?: string;
    changes?: Record<string, unknown>;
  },
) {
  return db.insert(history).values({
    userId: entry.userId,
    pokemonId: entry.pokemonId ?? null,
    action: entry.action,
    summary: entry.summary,
    changes: entry.changes,
  });
}
