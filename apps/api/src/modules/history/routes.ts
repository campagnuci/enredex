import { history } from "@enredex/database";
import { and, count, desc, eq, type SQL } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { paginationQuery } from "../../lib/zod-helpers.js";

const historyQuerySchema = z.object({
  pokemonId: z.uuid().optional(),
  ...paginationQuery,
});

export async function historyRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.get(
    "/",
    { schema: { querystring: historyQuerySchema } },
    async (request) => {
      const { pokemonId, limit, offset } = request.query;
      const conditions: SQL[] = [eq(history.userId, request.user.sub)];
      if (pokemonId) conditions.push(eq(history.pokemonId, pokemonId));
      const where = and(...conditions);

      const [data, totalRow] = await Promise.all([
        app.db
          .select()
          .from(history)
          .where(where)
          .orderBy(desc(history.createdAt))
          .limit(limit)
          .offset(offset),
        app.db.select({ value: count() }).from(history).where(where),
      ]);
      return { data, total: totalRow[0]?.value ?? 0, limit, offset };
    },
  );
}
