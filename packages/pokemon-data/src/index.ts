import { importRuns, type Database } from "@enredex/database";
import { sql } from "drizzle-orm";
import { importGenerations } from "./importers/generations.js";
import { importRegions, importGames } from "./importers/static-data.js";
import { importTypes } from "./importers/types.js";
import { importAbilities } from "./importers/abilities.js";
import { importMoves } from "./importers/moves.js";
import { importItems } from "./importers/items.js";
import { importBalls } from "./importers/balls.js";
import { importNatures } from "./importers/natures.js";
import { importSpeciesAndForms } from "./importers/species-forms.js";

export {
  importGenerations,
  importRegions,
  importGames,
  importTypes,
  importAbilities,
  importMoves,
  importItems,
  importBalls,
  importNatures,
  importSpeciesAndForms,
};

function ts(): string {
  return new Date().toISOString().slice(11, 19);
}

async function runStage(
  db: Database,
  label: string,
  fn: () => Promise<number | { speciesCount: number; formsCount: number }>,
) {
  const runId = crypto.randomUUID();
  await db.insert(importRuns).values({
    id: runId,
    source: "pokeapi",
    status: "running",
    startedAt: new Date(),
  });

  const start = Date.now();
  try {
    console.log(`[${ts()}] ${label}...`);
    const result = await fn();
    const ms = Date.now() - start;
    const count =
      typeof result === "number" ? result : `${result.speciesCount}s + ${result.formsCount}f`;
    console.log(`[${ts()}] ${label} done: ${count} rows (${(ms / 1000).toFixed(1)}s)`);
    await db
      .update(importRuns)
      .set({
        status: "success",
        finishedAt: new Date(),
        stats:
          typeof result === "number"
            ? { count: result }
            : { speciesCount: result.speciesCount, formsCount: result.formsCount },
      })
      .where(sql`id = ${runId}`);
  } catch (err) {
    const ms = Date.now() - start;
    console.error(`[${ts()}] ${label} FAILED (${(ms / 1000).toFixed(1)}s):`, String(err).slice(0, 200));
    await db
      .update(importRuns)
      .set({
        status: "failed",
        finishedAt: new Date(),
        error: String(err),
      })
      .where(sql`id = ${runId}`);
    return false;
  }
  return true;
}

export async function syncAll(db: Database): Promise<void> {
  console.log(`[${ts()}] === Enredex reference data sync ===`);

  const stages: [string, () => Promise<number | { speciesCount: number; formsCount: number }>][] = [
    ["Generations", () => importGenerations(db)],
    ["Regions", () => importRegions(db)],
    ["Games", () => importGames(db)],
    ["Types", () => importTypes(db)],
    ["Natures", () => importNatures(db)],
    ["Abilities", () => importAbilities(db)],
    ["Moves", () => importMoves(db)],
    ["Items", () => importItems(db)],
    ["Balls", () => importBalls(db)],
    ["Species & Forms", () => importSpeciesAndForms(db)],
  ];

  let failures = 0;
  for (const [label, fn] of stages) {
    const ok = await runStage(db, label, fn);
    if (!ok) failures++;
  }

  console.log(`[${ts()}] === Sync complete${failures ? ` (${failures} stage(s) failed)` : ""} ===`);
}
