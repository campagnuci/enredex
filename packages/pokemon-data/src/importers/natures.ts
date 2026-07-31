import { natures, type Database } from "@enredex/database";
import { sql } from "drizzle-orm";
import { fetchOne, fetchList, mapConcurrent } from "../client.js";
import type { BattleStat } from "@enredex/database";

interface PokeNature {
  id: number;
  name: string;
  increased_stat: { name: string } | null;
  decreased_stat: { name: string } | null;
}

const STAT_MAP: Record<string, BattleStat> = {
  hp: "hp",
  attack: "attack",
  defense: "defense",
  "special-attack": "special-attack",
  "special-defense": "special-defense",
  speed: "speed",
};

export async function importNatures(db: Database): Promise<number> {
  const list = await fetchList("nature");

  // Clear pre-existing seed data (which had null pokeapiId)
  await db.delete(natures);

  for (const item of list) {
    const n = (await fetchOne("nature", item.name)) as PokeNature;
    await db
      .insert(natures)
      .values({
        pokeapiId: n.id,
        name: n.name,
        increasedStat: n.increased_stat ? STAT_MAP[n.increased_stat.name] ?? null : null,
        decreasedStat: n.decreased_stat ? STAT_MAP[n.decreased_stat.name] ?? null : null,
        lastUpdatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: natures.name,
        set: {
          pokeapiId: sql`EXCLUDED.pokeapi_id`,
          increasedStat: sql`EXCLUDED.increased_stat`,
          decreasedStat: sql`EXCLUDED.decreased_stat`,
          lastUpdatedAt: sql`now()`,
        },
      });
  }

  const all = await db.select().from(natures);
  return all.length;
}
