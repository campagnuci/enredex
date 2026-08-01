import {
  boxes,
  pokemon,
  pokemonMoves,
  species,
  forms,
  type Pokemon,
} from "@enredex/database";
import {
  and,
  arrayContains,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import type { DbOrTx } from "../../lib/db.js";
import { errors } from "../../lib/errors.js";
import { recordHistory } from "../../lib/history.js";
import type {
  CreatePokemonBody,
  PokemonQuery,
  UpdatePokemonBody,
} from "./schemas.js";

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

async function assertSpeciesAndForm(
  db: DbOrTx,
  speciesId: number,
  formId?: number | null,
) {
  const sp = await db.query.species.findFirst({
    where: (s, { eq }) => eq(s.id, speciesId),
  });
  if (!sp) throw errors.badRequest("Unknown speciesId");
  if (formId != null) {
    const form = await db.query.forms.findFirst({
      where: (f, { and, eq }) => and(eq(f.id, formId), eq(f.speciesId, speciesId)),
    });
    if (!form) {
      throw errors.badRequest("formId does not belong to the given species");
    }
  }
  return sp;
}

/**
 * OT resolution: when the Pokémon belongs to one of the user's registered OTs,
 * all OT fields are auto-filled from the library entry. Otherwise the manually
 * entered external OT/TID/SID are used.
 */
async function resolveOtFields(
  db: DbOrTx,
  userId: string,
  input: {
    originalTrainerId?: string | null;
    otName?: string | null;
    trainerId?: number | null;
    secretId?: number | null;
  },
) {
  if (input.originalTrainerId) {
    const ot = await db.query.originalTrainers.findFirst({
      where: (o, { and, eq }) =>
        and(eq(o.id, input.originalTrainerId!), eq(o.userId, userId)),
    });
    if (!ot) throw errors.badRequest("Unknown originalTrainerId");
    return {
      originalTrainerId: ot.id,
      otName: ot.name,
      trainerId: ot.trainerId,
      secretId: ot.secretId,
    };
  }
  return {
    originalTrainerId: input.originalTrainerId ?? null,
    otName: input.otName ?? null,
    trainerId: input.trainerId ?? null,
    secretId: input.secretId ?? null,
  };
}

interface PlacementInput {
  location?: Pokemon["location"] | undefined;
  homePlan?: Pokemon["homePlan"] | null | undefined;
  boxId?: string | null | undefined;
  slot?: number | null | undefined;
  heldItemId?: number | null | undefined;
}

/**
 * Applies the location business rules and returns the normalized placement:
 * - location=home requires homePlan+boxId+slot and forbids held items
 * - any other location clears box/slot/plan
 * Also asserts box ownership and slot availability.
 */
async function resolvePlacement(
  db: DbOrTx,
  userId: string,
  merged: Required<Pick<PlacementInput, "location">> & PlacementInput,
  excludePokemonId?: string,
): Promise<{
  location: Pokemon["location"];
  homePlan: Pokemon["homePlan"] | null;
  boxId: string | null;
  slot: number | null;
  swapWithId: string | null;
}> {
  const location = merged.location;

  // Scope rule: held item must be NULL while located in HOME
  if (location === "home" && merged.heldItemId != null) {
    throw errors.badRequest(
      "A Pokémon located in Pokémon HOME cannot hold an item",
    );
  }

  if (location !== "home") {
    return { location, homePlan: null, boxId: null, slot: null, swapWithId: null };
  }

  const { homePlan, boxId, slot } = merged;
  if (!homePlan || !boxId || slot == null) {
    throw errors.badRequest(
      "location 'home' requires homePlan, boxId and slot",
    );
  }

  const box = await db.query.boxes.findFirst({
    where: (b, { and, eq }) => and(eq(b.id, boxId), eq(b.userId, userId)),
  });
  if (!box) throw errors.badRequest("boxId does not belong to you");

  const occupant = await db.query.pokemon.findFirst({
    where: (p, { and, eq, ne }) =>
      and(
        eq(p.boxId, boxId),
        eq(p.slot, slot),
        excludePokemonId ? ne(p.id, excludePokemonId) : undefined,
      ),
    columns: { id: true },
  });

  return { location, homePlan, boxId, slot, swapWithId: occupant?.id ?? null };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getPokemonDetail(
  db: DbOrTx,
  userId: string,
  id: string,
) {
  const row = await db.query.pokemon.findFirst({
    where: (p, { and, eq }) => and(eq(p.id, id), eq(p.userId, userId)),
    with: {
      species: true,
      form: true,
      box: true,
      teraType: true,
      nature: true,
      ability: true,
      ball: true,
      heldItem: true,
      originalTrainer: true,
      originGame: true,
      moves: {
        orderBy: (pm, { asc }) => asc(pm.slot),
        with: { move: true },
      },
    },
  });
  if (!row) throw errors.notFound("Pokémon not found");
  return row;
}

export async function listPokemon(
  db: DbOrTx,
  userId: string,
  query: PokemonQuery,
) {
  const conditions: (SQL | undefined)[] = [eq(pokemon.userId, userId)];

  if (query.q) {
    conditions.push(
      or(
        ilike(pokemon.nickname, `%${query.q}%`),
        ilike(species.name, `%${query.q}%`),
        ilike(pokemon.otName, `%${query.q}%`),
      ),
    );
  }
  if (query.speciesId) conditions.push(eq(pokemon.speciesId, query.speciesId));
  if (query.formId) conditions.push(eq(pokemon.formId, query.formId));
  if (query.gender) conditions.push(eq(pokemon.gender, query.gender));
  if (query.shiny !== undefined) conditions.push(eq(pokemon.isShiny, query.shiny));
  if (query.alpha !== undefined) conditions.push(eq(pokemon.isAlpha, query.alpha));
  if (query.gigantamax !== undefined)
    conditions.push(eq(pokemon.isGigantamax, query.gigantamax));
  if (query.location) conditions.push(eq(pokemon.location, query.location));
  if (query.gameId) conditions.push(eq(pokemon.originGameId, query.gameId));
  if (query.boxId) conditions.push(eq(pokemon.boxId, query.boxId));
  if (query.slot) conditions.push(eq(pokemon.slot, query.slot));
  if (query.ballId) conditions.push(eq(pokemon.ballId, query.ballId));
  if (query.natureId) conditions.push(eq(pokemon.natureId, query.natureId));
  if (query.abilityId) conditions.push(eq(pokemon.abilityId, query.abilityId));
  if (query.language) conditions.push(eq(pokemon.language, query.language));
  if (query.ot) conditions.push(ilike(pokemon.otName, `%${query.ot}%`));
  if (query.trainerId !== undefined)
    conditions.push(eq(pokemon.trainerId, query.trainerId));
  if (query.teraTypeId) conditions.push(eq(pokemon.teraTypeId, query.teraTypeId));
  if (query.heldItemId) conditions.push(eq(pokemon.heldItemId, query.heldItemId));
  if (query.levelMin) conditions.push(gte(pokemon.level, query.levelMin));
  if (query.levelMax) conditions.push(lte(pokemon.level, query.levelMax));
  if (query.favorite !== undefined)
    conditions.push(eq(pokemon.isFavorite, query.favorite));
  if (query.locked !== undefined) conditions.push(eq(pokemon.isLocked, query.locked));
  if (query.forTrade !== undefined)
    conditions.push(eq(pokemon.isForTrade, query.forTrade));
  if (query.loaned !== undefined) conditions.push(eq(pokemon.isLoaned, query.loaned));
  if (query.competitive !== undefined)
    conditions.push(eq(pokemon.isCompetitive, query.competitive));
  if (query.ribbonMaster !== undefined)
    conditions.push(eq(pokemon.isRibbonMaster, query.ribbonMaster));
  if (query.tags?.length) {
    conditions.push(arrayContains(pokemon.tags, query.tags));
  }
  if (query.labels?.length) {
    conditions.push(arrayContains(pokemon.labels, query.labels));
  }
  if (query.moveId) {
    conditions.push(sql`EXISTS (
      SELECT 1 FROM ${pokemonMoves}
      WHERE ${pokemonMoves.pokemonId} = ${pokemon.id}
        AND ${pokemonMoves.moveId} = ${query.moveId}
    )`);
  }

  const where = and(...conditions);
  const orderColumn = {
    createdAt: pokemon.createdAt,
    updatedAt: pokemon.updatedAt,
    level: pokemon.level,
    nickname: pokemon.nickname,
    nationalDex: species.nationalDexNumber,
    slot: pokemon.slot,
  }[query.sort];
  const orderBy = query.order === "asc" ? asc(orderColumn) : desc(orderColumn);

  const [rows, totalRow] = await Promise.all([
    db
      .select({
        pokemon,
        species: {
          id: species.id,
          name: species.name,
          nationalDexNumber: species.nationalDexNumber,
          pokeapiId: species.pokeapiId,
        },
        form: { id: forms.id, name: forms.name },
        box: { id: boxes.id, name: boxes.name },
      })
      .from(pokemon)
      .innerJoin(species, eq(pokemon.speciesId, species.id))
      .leftJoin(forms, eq(pokemon.formId, forms.id))
      .leftJoin(boxes, eq(pokemon.boxId, boxes.id))
      .where(where)
      .orderBy(orderBy)
      .limit(query.limit)
      .offset(query.offset),
    db.select({ value: count() }).from(pokemon).innerJoin(species, eq(pokemon.speciesId, species.id)).where(where),
  ]);

  return {
    data: rows.map((row) => ({
      ...row.pokemon,
      species: row.species,
      form: row.form?.id ? row.form : null,
      box: row.box?.id ? row.box : null,
    })),
    total: totalRow[0]?.value ?? 0,
    limit: query.limit,
    offset: query.offset,
  };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createPokemon(
  db: DbOrTx,
  userId: string,
  input: CreatePokemonBody,
) {
  const sp = await assertSpeciesAndForm(db, input.speciesId, input.formId);
  const otFields = await resolveOtFields(db, userId, input);
  const placement = await resolvePlacement(db, userId, {
    location: input.location ?? "home",
    homePlan: input.homePlan,
    boxId: input.boxId,
    slot: input.slot,
    heldItemId: input.heldItemId,
  });
  const { swapWithId: _, ...pl } = placement;

  const id = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(pokemon)
      .values({
        userId,
        speciesId: input.speciesId,
        formId: input.formId ?? null,
        gender: input.gender ?? "genderless",
        isShiny: input.isShiny ?? false,
        isAlpha: input.isAlpha ?? false,
        isGigantamax: input.isGigantamax ?? false,
        dynamaxLevel: input.dynamaxLevel ?? 0,
        teraTypeId: input.teraTypeId ?? null,
        nickname: input.nickname ?? null,
        language: input.language ?? null,
        level: input.level ?? 1,
        ...otFields,
        originGameId: input.originGameId ?? null,
        ...pl,
        metLevel: input.metLevel ?? null,
        metLocation: input.metLocation ?? null,
        metDate: input.metDate ?? null,
        ballId: input.ballId ?? null,
        isFatefulEncounter: input.isFatefulEncounter ?? false,
        natureId: input.natureId ?? null,
        abilityId: input.abilityId ?? null,
        isHiddenAbility: input.isHiddenAbility ?? false,
        heldItemId: input.heldItemId ?? null,
        evHp: input.evHp ?? null,
        evAttack: input.evAttack ?? null,
        evDefense: input.evDefense ?? null,
        evSpecialAttack: input.evSpecialAttack ?? null,
        evSpecialDefense: input.evSpecialDefense ?? null,
        evSpeed: input.evSpeed ?? null,
        ivHp: input.ivHp ?? null,
        ivAttack: input.ivAttack ?? null,
        ivDefense: input.ivDefense ?? null,
        ivSpecialAttack: input.ivSpecialAttack ?? null,
        ivSpecialDefense: input.ivSpecialDefense ?? null,
        ivSpeed: input.ivSpeed ?? null,
        hyperTrainedHp: input.hyperTrainedHp ?? false,
        hyperTrainedAttack: input.hyperTrainedAttack ?? false,
        hyperTrainedDefense: input.hyperTrainedDefense ?? false,
        hyperTrainedSpecialAttack: input.hyperTrainedSpecialAttack ?? false,
        hyperTrainedSpecialDefense: input.hyperTrainedSpecialDefense ?? false,
        hyperTrainedSpeed: input.hyperTrainedSpeed ?? false,
        isFavorite: input.isFavorite ?? false,
        isLocked: input.isLocked ?? false,
        isForTrade: input.isForTrade ?? false,
        isLoaned: input.isLoaned ?? false,
        isCompetitive: input.isCompetitive ?? false,
        isRibbonMaster: input.isRibbonMaster ?? false,
        notes: input.notes ?? null,
        tags: input.tags ?? [],
        labels: input.labels ?? [],
      })
      .returning({ id: pokemon.id });

    if (input.moves?.length) {
      await tx.insert(pokemonMoves).values(
        input.moves.map((m) => ({
          pokemonId: created!.id,
          moveId: m.moveId,
          slot: m.slot,
          ppUps: m.ppUps,
        })),
      );
    }

    await recordHistory(tx, {
      userId,
      pokemonId: created!.id,
      action: "create",
      summary: `Added ${input.nickname ?? sp.name}`,
    });
    return created!.id;
  });

  return getPokemonDetail(db, userId, id);
}

export async function updatePokemon(
  db: DbOrTx,
  userId: string,
  id: string,
  patch: UpdatePokemonBody,
) {
  const current = await db.query.pokemon.findFirst({
    where: (p, { and, eq }) => and(eq(p.id, id), eq(p.userId, userId)),
  });
  if (!current) throw errors.notFound("Pokémon not found");

  const speciesId = patch.speciesId ?? current.speciesId;
  const formId = patch.formId !== undefined ? patch.formId : current.formId;
  await assertSpeciesAndForm(db, speciesId, formId);

  const otFields =
    patch.originalTrainerId !== undefined
      ? await resolveOtFields(db, userId, patch)
      : {
          originalTrainerId: current.originalTrainerId,
          otName: patch.otName !== undefined ? patch.otName : current.otName,
          trainerId: patch.trainerId !== undefined ? patch.trainerId : current.trainerId,
          secretId: patch.secretId !== undefined ? patch.secretId : current.secretId,
        };

  const mergedLocation = patch.location ?? current.location;
  const placement = await resolvePlacement(
    db,
    userId,
    {
      location: mergedLocation,
      homePlan: patch.homePlan !== undefined ? patch.homePlan : current.homePlan,
      boxId: patch.boxId !== undefined ? patch.boxId : current.boxId,
      slot: patch.slot !== undefined ? patch.slot : current.slot,
      heldItemId:
        patch.heldItemId !== undefined ? patch.heldItemId : current.heldItemId,
    },
    id,
  );

  const moved =
    placement.location !== current.location ||
    placement.boxId !== current.boxId ||
    placement.slot !== current.slot;

  await db.transaction(async (tx) => {
    const { moves, ...scalarPatch } = patch;
    const { swapWithId: _sw, ...pl } = placement;

    // If swapping, clear both pokemons' slots first so the unique index doesn't conflict
    if (_sw) {
      await tx
        .update(pokemon)
        .set({ slot: null, boxId: null })
        .where(eq(pokemon.id, id));
      await tx
        .update(pokemon)
        .set({ slot: null, boxId: null })
        .where(eq(pokemon.id, _sw));
      // Now reassign: occupant → current slot, current → target slot
      await tx
        .update(pokemon)
        .set({ slot: current.slot, boxId: current.boxId, updatedAt: new Date() })
        .where(eq(pokemon.id, _sw));
    }

    await tx
      .update(pokemon)
      .set({
        ...scalarPatch,
        speciesId,
        formId,
        ...otFields,
        ...pl,
        updatedAt: new Date(),
      })
      .where(eq(pokemon.id, id));

    if (moves) {
      await tx.delete(pokemonMoves).where(eq(pokemonMoves.pokemonId, id));
      if (moves.length) {
        await tx.insert(pokemonMoves).values(
          moves.map((m) => ({
            pokemonId: id,
            moveId: m.moveId,
            slot: m.slot,
            ppUps: m.ppUps,
          })),
        );
      }
    }

    // Diff the scalar changes for the history entry
    const changes: Record<string, [unknown, unknown]> = {};
    for (const [key, value] of Object.entries(scalarPatch)) {
      if (value === undefined) continue;
      const oldValue = (current as Record<string, unknown>)[key];
      if (oldValue !== value) changes[key] = [oldValue, value];
    }
    for (const key of ["location", "homePlan", "boxId", "slot"] as const) {
      if (placement[key] !== current[key]) changes[key] = [current[key], placement[key]];
    }

    await recordHistory(tx, {
      userId,
      pokemonId: id,
      action: moved ? "move" : "update",
      summary: moved
        ? `Moved ${current.nickname ?? "Pokémon"} to ${placement.location}`
        : `Updated ${current.nickname ?? "Pokémon"}`,
      ...(Object.keys(changes).length ? { changes } : {}),
    });
  });

  return getPokemonDetail(db, userId, id);
}

export async function deletePokemon(db: DbOrTx, userId: string, id: string) {
  const current = await db.query.pokemon.findFirst({
    where: (p, { and, eq }) => and(eq(p.id, id), eq(p.userId, userId)),
    with: { species: { columns: { name: true } } },
  });
  if (!current) throw errors.notFound("Pokémon not found");

  await db.transaction(async (tx) => {
    // Written before the delete; pokemonId is set-null afterwards by the FK
    await recordHistory(tx, {
      userId,
      pokemonId: id,
      action: "delete",
      summary: `Removed ${current.nickname ?? current.species.name}`,
    });
    await tx.delete(pokemon).where(eq(pokemon.id, id));
  });
}
