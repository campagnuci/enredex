import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import {
  forgotPasswordBodySchema,
  loginBodySchema,
  refreshBodySchema,
  registerBodySchema,
  resetPasswordBodySchema,
  verifyEmailBodySchema,
} from "./schemas.js";
import * as authService from "./service.js";

export async function authRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  r.post(
    "/register",
    { schema: { body: registerBodySchema } },
    async (request, reply) => {
      const result = await authService.register(
        app,
        request,
        reply,
        request.body,
      );
      return reply.status(201).send(result);
    },
  );

  r.post(
    "/login",
    { schema: { body: loginBodySchema } },
    async (request, reply) => {
      return authService.login(app, request, reply, request.body);
    },
  );

  r.post(
    "/refresh",
    { schema: { body: refreshBodySchema } },
    async (request, reply) => {
      return authService.refresh(app, request, reply, request.body.refreshToken);
    },
  );

  r.post(
    "/logout",
    { schema: { body: refreshBodySchema } },
    async (request, reply) => {
      await authService.logout(app, request, reply, request.body.refreshToken);
      return reply.status(204).send();
    },
  );

  r.post(
    "/forgot-password",
    { schema: { body: forgotPasswordBodySchema } },
    async (request, reply) => {
      await authService.forgotPassword(app, request.body.email);
      return reply.status(204).send();
    },
  );

  r.post(
    "/reset-password",
    { schema: { body: resetPasswordBodySchema } },
    async (request, reply) => {
      await authService.resetPassword(
        app,
        request.body.token,
        request.body.password,
      );
      return reply.status(204).send();
    },
  );

  r.post(
    "/verify-email",
    { schema: { body: verifyEmailBodySchema } },
    async (request, reply) => {
      await authService.verifyEmail(app, request.body.token);
      return reply.status(204).send();
    },
  );
}
