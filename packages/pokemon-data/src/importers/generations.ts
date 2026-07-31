import { generations, type Database } from "@enredex/database";
import { sql } from "drizzle-orm";
import {
  extractId,
  fetchList,
  type PokeAPINamed,
} from "../client.js";

export async function importGenerations(db: Database): Promise<number> {
  const items = await fetchList("generation");

  const rows = items.map((g: PokeAPINamed) => ({
    number: extractId(g.url),
    name: g.name,
  }));

  if (rows.length === 0) return 0;

  for (const row of rows) {
    await db
      .insert(generations)
      .values(row)
      .onConflictDoUpdate({
        target: generations.number,
        set: { name: sql`EXCLUDED.name` },
      });
  }

  const all = await db.select().from(generations);
  return all.length;
}

/** Lookup: generation number → DB id. Call after importGenerations. */
export async function genMap(db: Database): Promise<Map<number, number>> {
  const all = await db.select().from(generations);
  return new Map(all.map((g) => [g.number, g.id]));
}
