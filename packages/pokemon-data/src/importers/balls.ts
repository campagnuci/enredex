import { balls, type Database } from "@enredex/database";
import { sql } from "drizzle-orm";
import { fetchJSON, fetchOne, mapConcurrent } from "../client.js";

interface PokeItemCategory {
  items: { name: string; url: string }[];
}
interface PokeBallItem {
  id: number;
  name: string;
}

export async function importBalls(db: Database): Promise<number> {
  const category = (await fetchJSON(
    "https://pokeapi.co/api/v2/item-category/34/",
  )) as PokeItemCategory;

  await mapConcurrent(
    category.items,
    async (item) => {
      const b = (await fetchOne("item", item.name)) as PokeBallItem;
      await db
        .insert(balls)
        .values({
          pokeapiId: b.id,
          name: b.name,
          lastUpdatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: balls.name,
          set: {
            pokeapiId: sql`EXCLUDED.pokeapi_id`,
            lastUpdatedAt: sql`now()`,
          },
        });
    },
    5,
  );

  const all = await db.select().from(balls);
  return all.length;
}
