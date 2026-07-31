import type { SpriteConfig, SpriteKind, SpriteProvider } from "./types.js";

const BASE = "https://play.pokemonshowdown.com/sprites";

/**
 * Maps our internal form names to Showdown's file-name convention.
 * Showdown uses "megax"/"megay" (no hyphen) for mega forms.
 */
function toShowdownId(config: SpriteConfig): string {
  if (!config.formName) return config.speciesName;
  let form = config.formName;
  if (form === "mega-x") form = "megax";
  else if (form === "mega-y") form = "megay";
  return `${config.speciesName}-${form}`;
}

/** Return the directory + filename prefix for each variant priority level. */
function resolveUrl(
  id: string,
  kind: SpriteKind,
  isShiny: boolean,
  isFemale: boolean,
): string | null {
  // Build candidates in the scope's priority order: female+shiny → female → shiny → regular
  if (isFemale && isShiny) {
    return `${BASE}/gen5-shiny/${id}-f.png`;
  }
  if (isFemale) {
    return `${BASE}/gen5/${id}-f.png`;
  }
  if (isShiny) {
    return `${BASE}/gen5-shiny/${id}.png`;
  }
  return `${BASE}/gen5/${id}.png`;
}

/**
 * Pokémon Showdown sprite provider (gen-5-style sprites).
 * Excellent support for forms, shiny variants, and female dimorphism.
 */
export const showdownProvider: SpriteProvider = (config, kind) => {
  if (kind === "official-artwork") return null; // not applicable
  const id = toShowdownId(config);
  return resolveUrl(id, kind, config.isShiny, config.isFemale);
};
