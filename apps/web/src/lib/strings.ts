import { cn } from "@/lib/utils";

/** "acid-armor" → "Acid Armor", "tapu-koko" → "Tapu Koko" */
export function capitalize(name: string): string {
  return name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
