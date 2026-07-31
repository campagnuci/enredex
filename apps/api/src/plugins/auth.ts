import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { errors } from "../lib/errors.js";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { sub: string };
    user: { sub: string };
  }
}

export async function authPlugin(app: FastifyInstance) {
  app.decorate(
    "authenticate",
    async (request: FastifyRequest, _reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch {
        throw errors.unauthorized("Missing or invalid access token");
      }
    },
  );
}
