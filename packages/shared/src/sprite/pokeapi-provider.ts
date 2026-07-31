import type { SpriteConfig, SpriteKind, SpriteProvider } from "./types.js";

const BASE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

/**
 * PokeAPI GitHub sprites provider.
 * Falls back from shiny → regular. Female sprites are in a subdirectory.
 */
function artworkUrl(pokeapiId: number): string {
  return `${BASE}/other/official-artwork/${pokeapiId}.png`;
}

function frontUrl(config: SpriteConfig): string {
  if (config.isShiny) {
    return `${BASE}/shiny/${config.pokeapiId}.png`;
  }
  if (config.isFemale) {
    return `${BASE}/female/${config.pokeapiId}.png`;
  }
  return `${BASE}/${config.pokeapiId}.png`;
}

/**
 * PokeAPI sprite provider — serves official pixel-art sprites and artwork.
 * Does NOT handle forms (the GitHub repo uses its own form-id scheme).
 */
export const pokeapiProvider: SpriteProvider = (config, kind) => {
  if (kind === "official-artwork") {
    return artworkUrl(config.pokeapiId);
  }
  return frontUrl(config);
};
