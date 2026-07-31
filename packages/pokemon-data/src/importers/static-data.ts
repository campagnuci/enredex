import { games, regions, type Database } from "@enredex/database";
import { sql } from "drizzle-orm";
import { genMap } from "./generations.js";

const REGION_NAMES = [
  "kanto",
  "johto",
  "hoenn",
  "sinnoh",
  "unova",
  "kalos",
  "alola",
  "galar",
  "hisui",
  "paldea",
];

export async function importRegions(db: Database): Promise<number> {
  for (const name of REGION_NAMES) {
    await db
      .insert(regions)
      .values({ name })
      .onConflictDoUpdate({
        target: regions.name,
        set: { name: sql`EXCLUDED.name` },
      });
  }
  const all = await db.select().from(regions);
  return all.length;
}

interface GameSeed {
  code: string;
  name: string;
  generationNumber: number | null;
}

const GAME_SEEDS: GameSeed[] = [
  { code: "red", name: "Pokémon Red", generationNumber: 1 },
  { code: "green", name: "Pokémon Green", generationNumber: 1 },
  { code: "blue", name: "Pokémon Blue", generationNumber: 1 },
  { code: "yellow", name: "Pokémon Yellow", generationNumber: 1 },
  { code: "gold", name: "Pokémon Gold", generationNumber: 2 },
  { code: "silver", name: "Pokémon Silver", generationNumber: 2 },
  { code: "crystal", name: "Pokémon Crystal", generationNumber: 2 },
  { code: "ruby", name: "Pokémon Ruby", generationNumber: 3 },
  { code: "sapphire", name: "Pokémon Sapphire", generationNumber: 3 },
  { code: "emerald", name: "Pokémon Emerald", generationNumber: 3 },
  { code: "firered", name: "Pokémon FireRed", generationNumber: 3 },
  { code: "leafgreen", name: "Pokémon LeafGreen", generationNumber: 3 },
  { code: "diamond", name: "Pokémon Diamond", generationNumber: 4 },
  { code: "pearl", name: "Pokémon Pearl", generationNumber: 4 },
  { code: "platinum", name: "Pokémon Platinum", generationNumber: 4 },
  { code: "heartgold", name: "Pokémon HeartGold", generationNumber: 4 },
  { code: "soulsilver", name: "Pokémon SoulSilver", generationNumber: 4 },
  { code: "black", name: "Pokémon Black", generationNumber: 5 },
  { code: "white", name: "Pokémon White", generationNumber: 5 },
  { code: "black-2", name: "Pokémon Black 2", generationNumber: 5 },
  { code: "white-2", name: "Pokémon White 2", generationNumber: 5 },
  { code: "x", name: "Pokémon X", generationNumber: 6 },
  { code: "y", name: "Pokémon Y", generationNumber: 6 },
  { code: "omega-ruby", name: "Pokémon Omega Ruby", generationNumber: 6 },
  { code: "alpha-sapphire", name: "Pokémon Alpha Sapphire", generationNumber: 6 },
  { code: "sun", name: "Pokémon Sun", generationNumber: 7 },
  { code: "moon", name: "Pokémon Moon", generationNumber: 7 },
  { code: "ultra-sun", name: "Pokémon Ultra Sun", generationNumber: 7 },
  { code: "ultra-moon", name: "Pokémon Ultra Moon", generationNumber: 7 },
  { code: "lets-go-pikachu", name: "Pokémon: Let's Go, Pikachu!", generationNumber: 7 },
  { code: "lets-go-eevee", name: "Pokémon: Let's Go, Eevee!", generationNumber: 7 },
  { code: "sword", name: "Pokémon Sword", generationNumber: 8 },
  { code: "shield", name: "Pokémon Shield", generationNumber: 8 },
  { code: "brilliant-diamond", name: "Pokémon Brilliant Diamond", generationNumber: 8 },
  { code: "shining-pearl", name: "Pokémon Shining Pearl", generationNumber: 8 },
  { code: "legends-arceus", name: "Pokémon Legends: Arceus", generationNumber: 8 },
  { code: "scarlet", name: "Pokémon Scarlet", generationNumber: 9 },
  { code: "violet", name: "Pokémon Violet", generationNumber: 9 },
  { code: "pokemon-go", name: "Pokémon GO", generationNumber: 7 },
  { code: "pokemon-bank", name: "Pokémon Bank", generationNumber: null },
  { code: "other", name: "Other", generationNumber: null },
];

export async function importGames(db: Database): Promise<number> {
  const gMap = await genMap(db);

  for (const seed of GAME_SEEDS) {
    await db
      .insert(games)
      .values({
        code: seed.code,
        name: seed.name,
        generationId: seed.generationNumber
          ? gMap.get(seed.generationNumber) ?? null
          : null,
      })
      .onConflictDoUpdate({
        target: games.code,
        set: {
          name: sql`EXCLUDED.name`,
          generationId: sql`EXCLUDED.generation_id`,
        },
      });
  }

  const all = await db.select().from(games);
  return all.length;
}
