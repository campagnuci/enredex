import { games, originalTrainers } from "@enredex/database";
import { and, asc, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { errors } from "../../lib/errors.js";

const upsertOtBodySchema = z.object({
  gameId: z.number().int().positive(),
  name: z.string().trim().min(1).max(100),
  trainerId: z.number().int().min(0),
  secretId: z.number().int().min(0).nullable().optional(),
});

const updateOtBodySchema = upsertOtBodySchema.partial();

const idParamSchema = z.object({ id: z.uuid() });

/**
 * Personal OT (Original Trainer) library — private per user.
 */
export async function otRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.get("/", async (request) => {
    return app.db
      .select({
        id: originalTrainers.id,
        gameId: originalTrainers.gameId,
        gameCode: games.code,
        gameName: games.name,
        name: originalTrainers.name,
        trainerId: originalTrainers.trainerId,
        secretId: originalTrainers.secretId,
        createdAt: originalTrainers.createdAt,
        updatedAt: originalTrainers.updatedAt,
      })
      .from(originalTrainers)
      .innerJoin(games, eq(originalTrainers.gameId, games.id))
      .where(eq(originalTrainers.userId, request.user.sub))
      .orderBy(asc(originalTrainers.name), asc(originalTrainers.trainerId));
  });

  r.post(
    "/",
    { schema: { body: upsertOtBodySchema } },
    async (request, reply) => {
      const game = await app.db.query.games.findFirst({
        where: (g, { eq }) => eq(g.id, request.body.gameId),
      });
      if (!game) throw errors.badRequest("Unknown gameId");

      const [created] = await app.db
        .insert(originalTrainers)
        .values({ ...request.body, userId: request.user.sub })
        .returning();
      return reply.status(201).send(created);
    },
  );

  r.patch(
    "/:id",
    { schema: { params: idParamSchema, body: updateOtBodySchema } },
    async (request) => {
      const { gameId } = request.body;
      if (gameId !== undefined) {
        const game = await app.db.query.games.findFirst({
          where: (g, { eq }) => eq(g.id, gameId),
        });
        if (!game) throw errors.badRequest("Unknown gameId");
      }

      const [updated] = await app.db
        .update(originalTrainers)
        .set({ ...request.body, updatedAt: new Date() })
        .where(
          and(
            eq(originalTrainers.id, request.params.id),
            eq(originalTrainers.userId, request.user.sub),
          ),
        )
        .returning();
      if (!updated) throw errors.notFound("OT not found");
      return updated;
    },
  );

  r.delete(
    "/:id",
    { schema: { params: idParamSchema } },
    async (request, reply) => {
      const [deleted] = await app.db
        .delete(originalTrainers)
        .where(
          and(
            eq(originalTrainers.id, request.params.id),
            eq(originalTrainers.userId, request.user.sub),
          ),
        )
        .returning({ id: originalTrainers.id });
      if (!deleted) throw errors.notFound("OT not found");
      return reply.status(204).send();
    },
  );
}
