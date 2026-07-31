import { boxes, pokemon } from "@enredex/database";
import { and, count, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { errors } from "../../lib/errors.js";
import { buildSpriteConfig } from "../../lib/sprites.js";
import type { SpriteConfig } from "@enredex/shared";
import {
  assertCanCreateBox,
  getBoxOrThrow,
  getBoxWithOccupants,
  listBoxes,
  nextBoxPosition,
} from "./service.js";

const createBoxBodySchema = z.object({
  name: z.string().trim().min(1).max(100),
  position: z.number().int().min(1).optional(),
});

const updateBoxBodySchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  position: z.number().int().min(1).optional(),
});

const idParamSchema = z.object({ id: z.uuid() });

export async function boxRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.get("/", async (request) => listBoxes(app.db, request.user.sub));

  r.post(
    "/",
    { schema: { body: createBoxBodySchema } },
    async (request, reply) => {
      const userId = request.user.sub;
      await assertCanCreateBox(app.db, userId);
      const position =
        request.body.position ?? (await nextBoxPosition(app.db, userId));
      const [created] = await app.db
        .insert(boxes)
        .values({ userId, name: request.body.name, position })
        .returning();
      return reply.status(201).send(created);
    },
  );

  r.get(
    "/:id",
    { schema: { params: idParamSchema } },
    async (request) => {
      const result = await getBoxWithOccupants(
        app.db,
        request.user.sub,
        request.params.id,
      );
      // Enrich occupants with sprite URLs for the grid UI
      result.occupants = result.occupants.map((occ) => {
        const config: SpriteConfig = {
          pokeapiId: occ.pokeapiId ?? 0,
          speciesName: occ.speciesName,
          formName: occ.formName ?? null,
          isShiny: occ.isShiny,
          isFemale: occ.gender === "female",
        };
        return {
          ...occ,
          iconUrl: app.sprite.resolveUrl(config, "icon"),
          artworkUrl: app.sprite.resolveUrl(config, "official-artwork"),
        };
      });
      return result;
    },
  );

  r.patch(
    "/:id",
    { schema: { params: idParamSchema, body: updateBoxBodySchema } },
    async (request) => {
      await getBoxOrThrow(app.db, request.user.sub, request.params.id);
      const [updated] = await app.db
        .update(boxes)
        .set({ ...request.body, updatedAt: new Date() })
        .where(eq(boxes.id, request.params.id))
        .returning();
      return updated;
    },
  );

  r.delete(
    "/:id",
    { schema: { params: idParamSchema } },
    async (request, reply) => {
      const box = await getBoxOrThrow(app.db, request.user.sub, request.params.id);
      const [row] = await app.db
        .select({ value: count() })
        .from(pokemon)
        .where(eq(pokemon.boxId, box.id));
      if ((row?.value ?? 0) > 0) {
        throw errors.conflict("Box is not empty; move its Pokémon first");
      }
      await app.db
        .delete(boxes)
        .where(and(eq(boxes.id, box.id), eq(boxes.userId, request.user.sub)));
      return reply.status(204).send();
    },
  );
}
