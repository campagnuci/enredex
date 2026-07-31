import type { SpriteService } from "@enredex/shared";
import type { Database } from "@enredex/database";
import type { preHandlerHookHandler } from "fastify";
import type { AppConfig } from "./config.js";
import type { Mailer } from "./lib/mailer.js";

declare module "fastify" {
  interface FastifyInstance {
    config: AppConfig;
    db: Database;
    mailer: Mailer;
    sprite: SpriteService;
    authenticate: preHandlerHookHandler;
  }
}
