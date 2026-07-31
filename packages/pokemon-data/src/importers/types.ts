import { types, type Database } from "@enredex/database";
import { sql } from "drizzle-orm";
import { fetchOne, fetchList } from "../client.js";
import { genMap } from "./generations.js";

interface PokeType {
  id: number;
  name: string;
  generation: { url: string };
}

export async function importTypes(db: Database): Promise<number> {
  const list = await fetchList("type");
  const gMap = await genMap(db);

  for (const item of list) {
    const t = (await fetchOne("type", item.name)) as PokeType;
    const genNum = Number(t.generation.url.match(/\/(\d+)\/?$/)![1]);
    await db
      .insert(types)
      .values({
        pokeapiId: t.id,
        name: t.name,
        generationId: gMap.get(genNum) ?? null,
        lastUpdatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: types.name,
        set: {
          pokeapiId: sql`EXCLUDED.pokeapi_id`,
          generationId: sql`EXCLUDED.generation_id`,
          lastUpdatedAt: sql`now()`,
        },
      });
  }

  const all = await db.select().from(types);
  return all.length;
}

export async function typeMap(db: Database): Promise<Map<number, number>> {
  const all = await db.select().from(types);
  return new Map(
    all.filter((t) => t.pokeapiId != null).map((t) => [t.pokeapiId!, t.id]),
  );
}
