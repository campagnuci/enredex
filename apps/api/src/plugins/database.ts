import { createDb, type Database } from "@enredex/database";
import type { FastifyInstance } from "fastify";

export async function databasePlugin(
  app: FastifyInstance,
  opts: { url: string },
) {
  const db = createDb(opts.url);
  app.decorate("db", db);
  app.addHook("onClose", async () => {
    await db.$client.end();
  });
}
