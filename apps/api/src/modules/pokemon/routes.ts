import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { addSpriteUrls } from "../../lib/sprites.js";
import {
  createPokemonBodySchema,
  pokemonQuerySchema,
  updatePokemonBodySchema,
} from "./schemas.js";
import {
  createPokemon,
  deletePokemon,
  getPokemonDetail,
  listPokemon,
  updatePokemon,
} from "./service.js";

const idParamSchema = z.object({ id: z.uuid() });

function withSprites(app: FastifyInstance, pokemon: Record<string, unknown>) {
  return { ...pokemon, ...addSpriteUrls(app, pokemon as any) };
}

export async function pokemonRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.get(
    "/",
    { schema: { querystring: pokemonQuerySchema } },
    async (request) => {
      const result = await listPokemon(
        app.db,
        request.user.sub,
        request.query,
      );
      const data = result.data.map((p) => withSprites(app, p));
      return { ...result, data };
    },
  );

  r.post(
    "/",
    { schema: { body: createPokemonBodySchema } },
    async (request, reply) => {
      const created = await createPokemon(
        app.db,
        request.user.sub,
        request.body,
      );
      return reply.status(201).send(withSprites(app, created));
    },
  );

  r.get(
    "/:id",
    { schema: { params: idParamSchema } },
    async (request) => {
      const pokemon = await getPokemonDetail(
        app.db,
        request.user.sub,
        request.params.id,
      );
      return withSprites(app, pokemon);
    },
  );

  r.patch(
    "/:id",
    { schema: { params: idParamSchema, body: updatePokemonBodySchema } },
    async (request) => {
      const updated = await updatePokemon(
        app.db,
        request.user.sub,
        request.params.id,
        request.body,
      );
      return withSprites(app, updated);
    },
  );

  r.delete(
    "/:id",
    { schema: { params: idParamSchema } },
    async (request, reply) => {
      await deletePokemon(app.db, request.user.sub, request.params.id);
      return reply.status(204).send();
    },
  );
}
