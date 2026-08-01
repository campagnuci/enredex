import {
  abilities,
  balls,
  forms,
  games,
  generations,
  items,
  moves,
  natures,
  regions,
  species,
  types,
} from "@enredex/database";
import { and, asc, count, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { errors } from "../../lib/errors.js";
import { paginationQuery } from "../../lib/zod-helpers.js";

const searchQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  ids: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(50),
});

const speciesQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  generationId: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(3000).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const movesQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  typeId: z.coerce.number().int().positive().optional(),
  ids: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(2000).default(50),
});

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

/**
 * Read-only reference data for dropdowns/autocompletes.
 * Data itself is maintained by the pokemon-data import pipeline.
 */
export async function referenceRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);
  const r = app.withTypeProvider<ZodTypeProvider>();

  // Small lookup tables in a single call
  r.get("/bootstrap", async () => {
    const db = app.db;
    const [gens, regs, gms, tps, nts, blls] = await Promise.all([
      db.select().from(generations).orderBy(asc(generations.number)),
      db.select().from(regions).orderBy(asc(regions.name)),
      db
        .select({
          id: games.id,
          code: games.code,
          name: games.name,
          generationId: games.generationId,
        })
        .from(games)
        .leftJoin(generations, eq(games.generationId, generations.id))
        .orderBy(asc(generations.number), asc(games.id)),
      db.select().from(types).orderBy(asc(types.name)),
      db.select().from(natures).orderBy(asc(natures.name)),
      db.select().from(balls).orderBy(asc(balls.name)),
    ]);
    return {
      generations: gens,
      regions: regs,
      games: gms,
      types: tps,
      natures: nts,
      balls: blls,
    };
  });

  r.get(
    "/species",
    { schema: { querystring: speciesQuerySchema } },
    async (request) => {
      const { search, generationId, limit, offset } = request.query;
      const conditions: SQL[] = [];
      if (search) {
        conditions.push(
          or(
            ilike(species.name, `%${search}%`),
            sql`CAST(${species.nationalDexNumber} AS text) LIKE ${search + "%"}`,
          ) as SQL,
        );
      }
      if (generationId) conditions.push(eq(species.generationId, generationId));

      const where = conditions.length ? and(...conditions) : undefined;
      const [data, totalRow] = await Promise.all([
        app.db
          .select({
            id: species.id,
            name: species.name,
            nationalDexNumber: species.nationalDexNumber,
            pokeapiId: species.pokeapiId,
            generationId: species.generationId,
            isLegendary: species.isLegendary,
            isMythical: species.isMythical,
          })
          .from(species)
          .where(where)
          .orderBy(asc(species.nationalDexNumber))
          .limit(limit)
          .offset(offset),
        app.db.select({ value: count() }).from(species).where(where),
      ]);
      return { data, total: totalRow[0]?.value ?? 0, limit, offset };
    },
  );

  r.get(
    "/species/:id",
    { schema: { params: idParamSchema } },
    async (request) => {
      const row = await app.db.query.species.findFirst({
        where: (s, { eq }) => eq(s.id, request.params.id),
        with: { forms: { orderBy: (f, { asc }) => asc(f.sortOrder) } },
      });
      if (!row) throw errors.notFound("Species not found");
      return row;
    },
  );

  r.get(
    "/abilities",
    { schema: { querystring: searchQuerySchema } },
    async (request) => {
      const { search, limit, ids } = request.query;
      const conditions: SQL[] = [];
      if (search) conditions.push(ilike(abilities.name, `%${search}%`));
      if (ids) conditions.push(inArray(abilities.id, ids.split(",").map(Number)));
      return app.db
        .select()
        .from(abilities)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(asc(abilities.name))
        .limit(limit);
    },
  );

  r.get(
    "/items",
    { schema: { querystring: searchQuerySchema } },
    async (request) => {
      const { search, limit } = request.query;
      return app.db
        .select()
        .from(items)
        .where(search ? ilike(items.name, `%${search}%`) : undefined)
        .orderBy(asc(items.name))
        .limit(limit);
    },
  );

  r.get(
    "/moves",
    { schema: { querystring: movesQuerySchema } },
    async (request) => {
      const { search, typeId, limit, ids } = request.query;
      const conditions: SQL[] = [];
      if (search) conditions.push(ilike(moves.name, `%${search}%`));
      if (typeId) conditions.push(eq(moves.typeId, typeId));
      if (ids) conditions.push(inArray(moves.id, ids.split(",").map(Number)));
      return app.db
        .select()
        .from(moves)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(asc(moves.name))
        .limit(limit);
    },
  );

  // --- Learnset cache ---
  const learnsetCache = new Map<number, { moves: number[]; types: { id: number; name: string }[]; abilities: string[]; ts: number }>();
  const LEARNSET_TTL = 3_600_000;
  const POKEAPI_BASE = "https://pokeapi.co/api/v2";

  r.get(
    "/species/:id/learnset",
    { schema: { params: idParamSchema } },
    async (request, reply) => {
      const speciesId = request.params.id;
      const cached = learnsetCache.get(speciesId);
      if (cached && Date.now() - cached.ts < LEARNSET_TTL) {
        return { moves: cached.moves, types: cached.types, abilities: cached.abilities };
      }

      const sp = await app.db.query.species.findFirst({
        where: (s, { eq }) => eq(s.id, speciesId),
        columns: { name: true },
      });
      if (!sp) throw errors.notFound("Species not found");

      try {
        // Fetch learnset from PokeAPI
        const res = await fetch(`${POKEAPI_BASE}/pokemon/${sp.name}`);
        if (!res.ok) throw new Error(`PokeAPI ${res.status}`);
        const data = (await res.json()) as {
          moves: { move: { name: string; url: string } }[];
          types: { slot: number; type: { name: string; url: string } }[];
          abilities: { ability: { name: string; url: string }; is_hidden: boolean; slot: number }[];
        };

        // Moves
        const allMoves = await app.db.select().from(moves);
        const nameToId = new Map(allMoves.map((m) => [m.name, m.id]));
        const moveIds = data.moves
          .map((m) => nameToId.get(m.move.name))
          .filter((id): id is number => id != null);

        // Types — extract PokeAPI type IDs for sprite URLs
        const typeIds = data.types.map((t) => {
          const id = Number(t.type.url.match(/\/(\d+)\/?$/)![1]);
          return { id, name: t.type.name };
        });

        // Abilities — resolve PokeAPI names to our DB IDs
        const allAbilities = await app.db.select().from(abilities);
        const abilityNameToId = new Map(allAbilities.map((a) => [a.name, a.id]));
        const abilityIds = data.abilities
          .map((a) => abilityNameToId.get(a.ability.name))
          .filter((id): id is number => id != null);

        learnsetCache.set(speciesId, { moves: moveIds, types: typeIds, abilities: abilityIds as any, ts: Date.now() });
        return { moves: moveIds, types: typeIds, abilities: abilityIds };
      } catch (err) {
        app.log.warn({ err, species: sp.name }, "learnset fetch failed");
        return { moves: [], types: [], abilities: [] };
      }
    },
  );
}
