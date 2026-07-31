import { boxes, users } from "@enredex/database";
import { count, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { errors } from "../../lib/errors.js";
import { publicUser } from "../auth/service.js";

const updateMeBodySchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  avatarUrl: z.url().nullable().optional(),
  homePlan: z.enum(["free", "premium"]).optional(),
});

export async function userRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.get("/me", async (request) => {
    const user = await app.db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, request.user.sub),
    });
    if (!user) throw errors.notFound("User not found");
    return publicUser(user);
  });

  r.patch(
    "/me",
    { schema: { body: updateMeBodySchema } },
    async (request) => {
      const userId = request.user.sub;
      const input = request.body;

      const user = await app.db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, userId),
      });
      if (!user) throw errors.notFound("User not found");

      // Downgrading premium -> free is only allowed within free-plan limits
      if (input.homePlan === "free" && user.homePlan === "premium") {
        const [row] = await app.db
          .select({ value: count() })
          .from(boxes)
          .where(eq(boxes.userId, userId));
        if ((row?.value ?? 0) > 1) {
          throw errors.conflict(
            "Cannot downgrade to the free plan while you have more than one box",
          );
        }
      }

      const [updated] = await app.db
        .update(users)
        .set({
          ...(input.name !== undefined && { name: input.name }),
          ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
          ...(input.homePlan !== undefined && { homePlan: input.homePlan }),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();
      return publicUser(updated!);
    },
  );
}
