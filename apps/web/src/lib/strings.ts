import { cn } from "@/lib/utils";

/** "venusaur" → "Venusaur", "tapu-koko" → "Tapu-Koko" */
export function capitalize(name: string): string {
  return name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("-");
}
