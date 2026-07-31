import { abilities, type Database } from "@enredex/database";
import { sql } from "drizzle-orm";
import { fetchOne, fetchList, mapConcurrent } from "../client.js";
import { genMap } from "./generations.js";

interface PokeAbility {
  id: number;
  name: string;
  generation: { url: string };
}

export async function importAbilities(db: Database): Promise<number> {
  const list = await fetchList("ability");
  const gMap = await genMap(db);

  await mapConcurrent(
    list,
    async (item) => {
      const a = (await fetchOne("ability", item.name)) as PokeAbility;
      const genNum = Number(a.generation.url.match(/\/(\d+)\/?$/)![1]);
      await db
        .insert(abilities)
        .values({
          pokeapiId: a.id,
          name: a.name,
          generationId: gMap.get(genNum) ?? null,
          lastUpdatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: abilities.name,
          set: {
            pokeapiId: sql`EXCLUDED.pokeapi_id`,
            generationId: sql`EXCLUDED.generation_id`,
            lastUpdatedAt: sql`now()`,
          },
        });
    },
    5,
  );

  const all = await db.select().from(abilities);
  return all.length;
}
