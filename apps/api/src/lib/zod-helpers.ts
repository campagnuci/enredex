import { z } from "zod";

/** Query-string boolean: "true"/"false" -> boolean */
export const boolQuery = z
  .enum(["true", "false"])
  .transform((v) => v === "true");

/** Repeated (?tags=a&tags=b) or comma-separated (?tags=a,b) string params */
export const stringListQuery = z
  .union([z.string(), z.array(z.string())])
  .transform((v) =>
    (Array.isArray(v) ? v : v.split(","))
      .map((s) => s.trim())
      .filter(Boolean),
  )
  .pipe(z.array(z.string().max(50)).max(100));

export const paginationQuery = {
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
};
