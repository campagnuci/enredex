import { cn } from "@/lib/utils";

/** "acid-armor" → "Acid Armor", "tapu-koko" → "Tapu Koko" */
export function capitalize(name: string): string {
  return name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const TYPE_SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/refs/heads/master/sprites/types/generation-ix/scarlet-violet";

/** Returns a URL for the PokeAPI type badge (symbol only, small). */
export function typeIconUrl(pokeapiTypeId: number): string {
  return `${TYPE_SPRITE_BASE}/small/${pokeapiTypeId}.png`;
}

/** Returns a URL for the PokeAPI type badge (full: symbol + text). */
export function typeBadgeUrl(pokeapiTypeId: number): string {
  return `${TYPE_SPRITE_BASE}/${pokeapiTypeId}.png`;
}
