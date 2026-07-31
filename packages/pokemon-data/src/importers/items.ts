import { items, type Database } from "@enredex/database";
import { sql } from "drizzle-orm";
import { fetchOne, fetchList, mapConcurrent } from "../client.js";
import { genMap } from "./generations.js";

interface PokeItem {
  id: number;
  name: string;
  category: { name: string };
  generation?: { url?: string };
}

export async function importItems(db: Database): Promise<number> {
  const list = await fetchList("item");
  const gMap = await genMap(db);

  let count = 0;
  await mapConcurrent(
    list,
    async (item) => {
      const it = (await fetchOne("item", item.name)) as PokeItem;
      const genNum = it.generation?.url
        ? Number(it.generation.url.match(/\/(\d+)\/?$/)![1])
        : null;
      await db
        .insert(items)
        .values({
          pokeapiId: it.id,
          name: it.name,
          category: it.category.name,
          generationId: genNum ? (gMap.get(genNum) ?? null) : null,
          lastUpdatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: items.name,
          set: {
            pokeapiId: sql`EXCLUDED.pokeapi_id`,
            category: sql`EXCLUDED.category`,
            generationId: sql`EXCLUDED.generation_id`,
            lastUpdatedAt: sql`now()`,
          },
        });
      count++;
      if (count % 250 === 0) console.log(`  items: ${count}/${list.length}`);
    },
    5,
  );

  const all = await db.select().from(items);
  return all.length;
}
