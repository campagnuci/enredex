import type { SpriteConfig, SpriteKind, SpriteProvider } from "./types.js";
import { showdownProvider } from "./showdown-provider.js";
import { pokeapiProvider } from "./pokeapi-provider.js";

export { type SpriteConfig, type SpriteKind, type SpriteProvider } from "./types.js";
export { showdownProvider } from "./showdown-provider.js";
export { pokeapiProvider } from "./pokeapi-provider.js";

/** The default built-in providers you can pass to SpriteService. */
export const builtinProviders: SpriteProvider[] = [
  showdownProvider,
  pokeapiProvider,
];

export interface SpriteServiceOptions {
  /** Ordered sprite providers — earlier providers take precedence. */
  providers?: SpriteProvider[];
}

/**
 * Replaceable sprite resolution service.
 *
 * Resolves the best sprite URL for the given config by trying each registered
 * provider in order.  Built-in providers default to Pokémon Showdown (gen 5
 * pixel art, best form support) with a PokeAPI official-artwork fallback.
 *
 * Usage:
 *   const service = new SpriteService();
 *   const url = service.resolveUrl({ pokeapiId: 25, speciesName: "pikachu", ... }, "icon");
 */
export class SpriteService {
  private readonly providers: SpriteProvider[];

  constructor(opts: SpriteServiceOptions = {}) {
    this.providers = opts.providers ?? builtinProviders;
  }

  /**
   * Resolve a sprite URL. Returns null when no provider can serve the request
   * (the caller should render a placeholder).
   */
  resolveUrl(config: SpriteConfig, kind: SpriteKind = "icon"): string | null {
    for (const provider of this.providers) {
      const url = provider(config, kind);
      if (url) return url;
    }
    return null;
  }
}
