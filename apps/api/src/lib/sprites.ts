import { SpriteService, type SpriteConfig } from "@enredex/shared";
import type { FastifyInstance } from "fastify";

export async function spritePlugin(app: FastifyInstance) {
  app.decorate("sprite", new SpriteService());
}

/** Extract SpriteConfig from a pokemon row (works with both flat list rows and relational detail rows). */
export function buildSpriteConfig(row: {
  species: { pokeapiId: number | null; name: string } | null;
  form?: { name: string } | null;
  gender: string;
  isShiny: boolean;
}): SpriteConfig {
  return {
    pokeapiId: row.species?.pokeapiId ?? 0,
    speciesName: row.species?.name ?? "unknown",
    formName: row.form?.name ?? null,
    isShiny: row.isShiny,
    isFemale: row.gender === "female",
  };
}

export function addSpriteUrls(app: FastifyInstance, row: Parameters<typeof buildSpriteConfig>[0]) {
  const config = buildSpriteConfig(row);
  return {
    iconUrl: app.sprite.resolveUrl(config, "icon"),
    artworkUrl: app.sprite.resolveUrl(config, "official-artwork"),
  };
}
