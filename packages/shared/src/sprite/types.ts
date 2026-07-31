/**
 * Shape the caller provides — no database dependency.
 * Every field is a plain value the service uses to build a sprite URL.
 */
export interface SpriteConfig {
  /** PokeAPI species id (for PokeAPI GitHub URLs). */
  pokeapiId: number;
  /** Species name in lowercase (for Showdown URLs). */
  speciesName: string;
  /** Form identifier (e.g. "alola", "mega-x", "gmax"), null for default. */
  formName: string | null;
  /** Whether the Pokémon is shiny. */
  isShiny: boolean;
  /** Whether the Pokémon is female (only matters for gender-dimorphic species). */
  isFemale: boolean;
}

export type SpriteKind = "icon" | "front" | "official-artwork";

/**
 * A provider returns a URL string for the given config+kind,
 * or null when it cannot serve that combination.
 */
export type SpriteProvider = (
  config: SpriteConfig,
  kind: SpriteKind,
) => string | null;
