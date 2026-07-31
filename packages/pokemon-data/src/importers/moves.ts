import { moves, type Database } from "@enredex/database";
import { sql } from "drizzle-orm";
import { fetchOne, fetchList, mapConcurrent } from "../client.js";
import { genMap } from "./generations.js";
import { typeMap } from "./types.js";

interface PokeMove {
  id: number;
  name: string;
  type: { url: string };
  damage_class: { name: string } | null;
  power: number | null;
  pp: number | null;
  accuracy: number | null;
  generation: { url: string };
}

const DC_MAP: Record<string, "physical" | "special" | "status"> = {
  physical: "physical",
  special: "special",
  status: "status",
};

export async function importMoves(db: Database): Promise<number> {
  const list = await fetchList("move");
  const gMap = await genMap(db);
  const tMap = await typeMap(db);

  let count = 0;
  await mapConcurrent(
    list,
    async (item) => {
      const m = (await fetchOne("move", item.name)) as PokeMove;
      const genNum = Number(m.generation.url.match(/\/(\d+)\/?$/)![1]);
      const typePokeapiId = Number(m.type.url.match(/\/(\d+)\/?$/)![1]);
      await db
        .insert(moves)
        .values({
          pokeapiId: m.id,
          name: m.name,
          typeId: tMap.get(typePokeapiId) ?? null,
          damageClass: m.damage_class
            ? (DC_MAP[m.damage_class.name] ?? null)
            : null,
          power: m.power,
          pp: m.pp,
          accuracy: m.accuracy,
          generationId: gMap.get(genNum) ?? null,
          lastUpdatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: moves.name,
          set: {
            pokeapiId: sql`EXCLUDED.pokeapi_id`,
            typeId: sql`EXCLUDED.type_id`,
            damageClass: sql`EXCLUDED.damage_class`,
            power: sql`EXCLUDED.power`,
            pp: sql`EXCLUDED.pp`,
            accuracy: sql`EXCLUDED.accuracy`,
            generationId: sql`EXCLUDED.generation_id`,
            lastUpdatedAt: sql`now()`,
          },
        });
      count++;
      if (count % 100 === 0) console.log(`  moves: ${count}/${list.length}`);
    },
    5,
  );

  const all = await db.select().from(moves);
  return all.length;
}
