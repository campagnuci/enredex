/**
 * Dev seed script — populates the database with sample data for development.
 *
 * Usage:
 *   pnpm seed           # create seed data (skips if already exists)
 *   pnpm seed --reset   # delete seed data and re-create
 *
 * Prerequisites: Postgres running (pnpm db:up), migrations applied (pnpm db:migrate),
 *   and reference data imported (pnpm sync).
 */
import { createDb, boxes, games, originalTrainers, pokemon, pokemonMoves, species, users } from "@enredex/database";
import argon2 from "argon2";

process.loadEnvFile();

const DB_URL = process.env.DATABASE_URL ?? "postgresql://enredex:enredex@localhost:5432/enredex";
const SEED_EMAIL = "ash@enredex.dev";
const SEED_PASSWORD = "pikachu123";
const RESET = process.argv.includes("--reset");

const db = createDb(DB_URL);

// --- Helpers ---

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// --- Check existing ---

const existing = await db.query.users.findFirst({
  where: (u, { eq }) => eq(u.email, SEED_EMAIL),
});

if (existing && !RESET) {
  console.log(`Seed user "${SEED_EMAIL}" already exists — skipping. Use --reset to re-create.`);
  await db.$client.end();
  process.exit(0);
}

if (existing && RESET) {
  console.log("Resetting seed data...");
  await db.delete(pokemonMoves);
  await db.delete(pokemon);
  await db.delete(originalTrainers);
  await db.delete(boxes);
  await db.delete(users);
  console.log("  cleaned");
}

// --- User ---

const passwordHash = await argon2.hash(SEED_PASSWORD);
const [user] = await db
  .insert(users)
  .values({
    name: "Ash",
    email: SEED_EMAIL,
    passwordHash,
    homePlan: "free",
  })
  .returning();
console.log(`User: ${user!.name} (${user!.email})`);

// --- Boxes ---

const boxNames = ["Kanto", "Johto"];
const createdBoxes: typeof boxes.$inferSelect[] = [];
for (let i = 0; i < boxNames.length; i++) {
  const [box] = await db
    .insert(boxes)
    .values({ userId: user!.id, name: boxNames[i]!, position: i + 1 })
    .returning();
  createdBoxes.push(box!);
}
console.log(`Boxes: ${createdBoxes.map((b) => b.name).join(", ")}`);

// --- OTs ---

const gameList = await db.select().from(games);
const scarlet = gameList.find((g) => g.code === "scarlet");
const sword = gameList.find((g) => g.code === "sword");
const emerald = gameList.find((g) => g.code === "emerald");

const otSeeds = [
  { gameId: scarlet!.id, name: "Ash", trainerId: 12345 },
  { gameId: sword!.id, name: "Gloria", trainerId: 67890, secretId: 42 },
  { gameId: emerald!.id, name: "Brendan", trainerId: 11223 },
];
const createdOTs: typeof originalTrainers.$inferSelect[] = [];
for (const ot of otSeeds) {
  const [row] = await db
    .insert(originalTrainers)
    .values({ userId: user!.id, ...ot })
    .returning();
  createdOTs.push(row!);
}
console.log(`OTs: ${createdOTs.map((o) => `${o.name} (TID ${o.trainerId})`).join(", ")}`);

// --- Species pool ---

const allSpecies = await db
  .select()
  .from(species)
  .orderBy(species.nationalDexNumber);

// Pick a spread across generations: starters, fan-favourites, legendaries
const dexTargets = new Set([
  1, 4, 6, 7, 25, 39, 94, 131, 133, 134, 135, 136, 143, 149, 150,
  152, 155, 158, 196, 197, 248, 249, 251,
  252, 254, 257, 258, 260, 280, 282, 306, 330, 334, 350, 373, 376, 384,
  390, 392, 395, 418, 445, 448,
  495, 498, 500, 587, 609, 635, 658,
  653, 655, 658, 700, 715,
  722, 724, 778, 791, 809,
  906, 908, 940,
]);
const chosen = allSpecies.filter((s) => dexTargets.has(s.nationalDexNumber));

// --- Pokémon templates ---

const mons: { nickname: string | null; level: number; gender: "male" | "female" | "genderless"; isShiny: boolean; tags: string[] }[] = [
  { nickname: "Sparky", level: 50, gender: "male", isShiny: false, tags: ["ace", "kanto"] },
  { nickname: null, level: 25, gender: "female", isShiny: true, tags: ["shiny"] },
  { nickname: "Blaze", level: 36, gender: "male", isShiny: false, tags: ["starter", "kanto"] },
  { nickname: null, level: 65, gender: "genderless", isShiny: false, tags: ["legendary"] },
  { nickname: "Hydro", level: 42, gender: "male", isShiny: false, tags: ["starter", "kanto"] },
  { nickname: "Draco", level: 55, gender: "male", isShiny: false, tags: ["dragon", "ace"] },
  { nickname: "Luna", level: 30, gender: "female", isShiny: true, tags: ["shiny", "eeveelution"] },
  { nickname: null, level: 70, gender: "genderless", isShiny: false, tags: ["legendary"] },
  { nickname: "Cheeks", level: 15, gender: "male", isShiny: false, tags: ["cute"] },
  { nickname: "Shellshock", level: 44, gender: "male", isShiny: false, tags: ["starter", "kanto"] },
  { nickname: null, level: 18, gender: "female", isShiny: false, tags: ["cute"] },
  { nickname: "Spooks", level: 28, gender: "male", isShiny: false, tags: ["ghost"] },
  { nickname: "Giga", level: 100, gender: "genderless", isShiny: true, tags: ["shiny", "legendary", "ace"] },
  { nickname: "Fluffy", level: 12, gender: "female", isShiny: false, tags: ["cute"] },
  { nickname: null, level: 90, gender: "male", isShiny: false, tags: ["pseudo-legendary"] },
  { nickname: "Zippy", level: 38, gender: "male", isShiny: false, tags: ["electric", "kanto"] },
  { nickname: "Nessie", level: 70, gender: "female", isShiny: false, tags: ["dragon"] },
  { nickname: "Saur", level: 60, gender: "male", isShiny: false, tags: ["starter", "grass"] },
  { nickname: null, level: 20, gender: "male", isShiny: false, tags: ["cute"] },
  { nickname: "Brute", level: 52, gender: "male", isShiny: false, tags: ["fighting"] },
  { nickname: "Razor", level: 66, gender: "male", isShiny: true, tags: ["shiny", "dragon"] },
  { nickname: null, level: 30, gender: "female", isShiny: false, tags: ["psychic"] },
  { nickname: "Buzzy", level: 22, gender: "male", isShiny: false, tags: ["bug", "cute"] },
  { nickname: "Aura", level: 48, gender: "genderless", isShiny: false, tags: ["legendary"] },
  { nickname: "Froggy", level: 28, gender: "male", isShiny: false, tags: ["starter", "water"] },
];

let boxIdx = 0;
let slot = 1;
let count = 0;

for (const tmpl of mons) {
  const sp = pick(chosen);
  const box = createdBoxes[boxIdx]!;

  if (slot > 30) { boxIdx = (boxIdx + 1) % createdBoxes.length; slot = 1; }

  const ot = pick(createdOTs);
  await db.insert(pokemon).values({
    userId: user!.id,
    speciesId: sp.id,
    gender: tmpl.gender,
    isShiny: tmpl.isShiny,
    isFavorite: count < 4,
    nickname: tmpl.nickname,
    level: tmpl.level,
    location: "home",
    homePlan: "free",
    boxId: box.id,
    slot,
    tags: tmpl.tags.slice(0, 5),
    ivHp: rand(0, 31),
    ivAttack: rand(0, 31),
    ivDefense: rand(0, 31),
    ivSpecialAttack: rand(0, 31),
    ivSpecialDefense: rand(0, 31),
    ivSpeed: rand(0, 31),
    originalTrainerId: ot.id,
    otName: ot.name,
    trainerId: ot.trainerId,
  });
  slot++;
  count++;
  if (count % 5 === 0) process.stdout.write(".");
}

console.log(`\nSeed complete: ${createdBoxes.length} boxes, ${createdOTs.length} OTs, ${count} Pokémon`);
console.log(`\nDev login:   ${SEED_EMAIL}  /  ${SEED_PASSWORD}`);
console.log("Run the API server (pnpm dev:api) and browse the collection.\n");

await db.$client.end();
