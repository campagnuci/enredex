import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import fastifySensible from "@fastify/sensible";
import Fastify, { type FastifyInstance } from "fastify";
import {
  hasZodFastifySchemaValidationErrors,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import { loadConfig } from "./config.js";
import { mapPgError } from "./lib/db.js";
import { AppError } from "./lib/errors.js";
import { createMailer } from "./lib/mailer.js";
import { authRoutes } from "./modules/auth/routes.js";
import { boxRoutes } from "./modules/boxes/routes.js";
import { historyRoutes } from "./modules/history/routes.js";
import { otRoutes } from "./modules/ots/routes.js";
import { pokemonRoutes } from "./modules/pokemon/routes.js";
import { referenceRoutes } from "./modules/reference/routes.js";
import { userRoutes } from "./modules/users/routes.js";
import { authPlugin } from "./plugins/auth.js";
import { databasePlugin } from "./plugins/database.js";
import { spritePlugin } from "./lib/sprites.js";

export async function buildApp(): Promise<FastifyInstance> {
  const config = loadConfig();

  const app = Fastify({
    trustProxy: true,
    logger:
      config.NODE_ENV === "development"
        ? {
            level: "info",
            transport: {
              target: "pino-pretty",
              options: { translateTime: "HH:MM:ss", ignore: "pid,hostname" },
            },
          }
        : { level: "info" },
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.setErrorHandler((err, request, reply) => {
    if (err instanceof AppError) {
      return reply
        .status(err.statusCode)
        .send({ statusCode: err.statusCode, error: err.code, message: err.message });
    }
    if (hasZodFastifySchemaValidationErrors(err)) {
      return reply.status(400).send({
        statusCode: 400,
        error: "VALIDATION_ERROR",
        message: "Request validation failed",
        issues: err.validation,
      });
    }
    const pgMapped = mapPgErrorOrNull(err);
    if (pgMapped) {
      return reply
        .status(pgMapped.statusCode)
        .send({
          statusCode: pgMapped.statusCode,
          error: pgMapped.code,
          message: pgMapped.message,
        });
    }
    const fastifyErr = err as { statusCode?: number; code?: string; message?: string };
    if (fastifyErr.statusCode && fastifyErr.statusCode < 500) {
      return reply.status(fastifyErr.statusCode).send({
        statusCode: fastifyErr.statusCode,
        error: fastifyErr.code ?? "ERROR",
        message: fastifyErr.message ?? "Error",
      });
    }
    request.log.error(err);
    return reply
      .status(500)
      .send({ statusCode: 500, error: "INTERNAL_SERVER_ERROR", message: "Internal server error" });
  });

  function mapPgErrorOrNull(err: unknown): AppError | null {
    try {
      mapPgError(err);
      return null;
    } catch (mapped) {
      return mapped instanceof AppError ? mapped : null;
    }
  }

  await app.register(fastifySensible);
  await app.register(fastifyCors, {
    origin: config.WEB_URL,
    credentials: true,
  });
  await app.register(fastifyCookie);
  await app.register(fastifyJwt, { secret: config.JWT_SECRET });

  app.decorate("config", config);
  app.decorate("mailer", createMailer(config, app.log));
  // Called directly (not register) so decorators apply to the root scope
  await databasePlugin(app, { url: config.DATABASE_URL });
  await authPlugin(app);
  await spritePlugin(app);

  app.get("/health", async () => ({ status: "ok" }));

  await app.register(
    async (api) => {
      await api.register(authRoutes, { prefix: "/auth" });
      await api.register(userRoutes, { prefix: "/users" });
      await api.register(referenceRoutes, { prefix: "/reference" });
      await api.register(otRoutes, { prefix: "/ots" });
      await api.register(boxRoutes, { prefix: "/boxes" });
      await api.register(pokemonRoutes, { prefix: "/pokemon" });
      await api.register(historyRoutes, { prefix: "/history" });
    },
    { prefix: "/api" },
  );

  return app;
}
