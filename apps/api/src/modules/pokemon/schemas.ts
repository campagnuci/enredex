import {
  genderEnum,
  homePlanEnum,
  pokemonLanguageEnum,
  pokemonLocationEnum,
} from "@enredex/database";
import { z } from "zod";
import {
  boolQuery,
  paginationQuery,
  stringListQuery,
} from "../../lib/zod-helpers.js";

const optInt = z.number().int().positive().nullable().optional();
const optStat = z.number().int().min(0).nullable().optional();

const tagList = z
  .array(z.string().trim().min(1).max(50))
  .max(100)
  .transform((tags) => [...new Set(tags)]);

const movesSchema = z
  .array(
    z.object({
      moveId: z.number().int().positive(),
      slot: z.number().int().min(1).max(4),
      ppUps: z.number().int().min(0).max(3).default(0),
    }),
  )
  .max(4)
  .superRefine((moves, ctx) => {
    const slots = new Set<number>();
    const ids = new Set<number>();
    for (const m of moves) {
      if (slots.has(m.slot)) {
        ctx.addIssue({ code: "custom", message: "Duplicate move slot" });
      }
      if (ids.has(m.moveId)) {
        ctx.addIssue({ code: "custom", message: "Duplicate move" });
      }
      slots.add(m.slot);
      ids.add(m.moveId);
    }
  });

export const createPokemonBodySchema = z.object({
  // Identity
  speciesId: z.number().int().positive(),
  formId: optInt,
  gender: z.enum(genderEnum.enumValues).optional(),
  isShiny: z.boolean().optional(),
  isAlpha: z.boolean().optional(),
  isGigantamax: z.boolean().optional(),
  dynamaxLevel: z.number().int().min(0).max(10).optional(),
  teraTypeId: optInt,
  nickname: z.string().trim().min(1).max(100).nullable().optional(),
  language: z.enum(pokemonLanguageEnum.enumValues).nullable().optional(),
  level: z.number().int().min(1).max(100).optional(),

  // Origin
  originalTrainerId: z.uuid().nullable().optional(),
  otName: z.string().trim().min(1).max(100).nullable().optional(),
  trainerId: z.number().int().min(0).nullable().optional(),
  secretId: z.number().int().min(0).nullable().optional(),
  originGameId: optInt,
  location: z.enum(pokemonLocationEnum.enumValues).optional(),
  homePlan: z.enum(homePlanEnum.enumValues).nullable().optional(),
  boxId: z.uuid().nullable().optional(),
  slot: z.number().int().min(1).max(30).nullable().optional(),
  metLevel: z.number().int().min(1).max(100).nullable().optional(),
  metLocation: z.string().trim().min(1).max(150).nullable().optional(),
  metDate: z.iso.date().nullable().optional(),
  ballId: optInt,
  isFatefulEncounter: z.boolean().optional(),

  // Battle
  natureId: optInt,
  abilityId: optInt,
  isHiddenAbility: z.boolean().optional(),
  heldItemId: optInt,
  moves: movesSchema.optional(),
  evHp: optStat,
  evAttack: optStat,
  evDefense: optStat,
  evSpecialAttack: optStat,
  evSpecialDefense: optStat,
  evSpeed: optStat,
  ivHp: optStat,
  ivAttack: optStat,
  ivDefense: optStat,
  ivSpecialAttack: optStat,
  ivSpecialDefense: optStat,
  ivSpeed: optStat,
  hyperTrainedHp: z.boolean().optional(),
  hyperTrainedAttack: z.boolean().optional(),
  hyperTrainedDefense: z.boolean().optional(),
  hyperTrainedSpecialAttack: z.boolean().optional(),
  hyperTrainedSpecialDefense: z.boolean().optional(),
  hyperTrainedSpeed: z.boolean().optional(),

  // Status
  isFavorite: z.boolean().optional(),
  isLocked: z.boolean().optional(),
  isForTrade: z.boolean().optional(),
  isLoaned: z.boolean().optional(),
  isCompetitive: z.boolean().optional(),
  isRibbonMaster: z.boolean().optional(),

  // Misc
  notes: z.string().max(10_000).nullable().optional(),
  tags: tagList.optional(),
  labels: tagList.optional(),
});

export const updatePokemonBodySchema = createPokemonBodySchema.partial();

export const pokemonQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  speciesId: z.coerce.number().int().positive().optional(),
  formId: z.coerce.number().int().positive().optional(),
  gender: z.enum(genderEnum.enumValues).optional(),
  shiny: boolQuery.optional(),
  alpha: boolQuery.optional(),
  gigantamax: boolQuery.optional(),
  location: z.enum(pokemonLocationEnum.enumValues).optional(),
  gameId: z.coerce.number().int().positive().optional(),
  boxId: z.uuid().optional(),
  slot: z.coerce.number().int().min(1).max(30).optional(),
  ballId: z.coerce.number().int().positive().optional(),
  natureId: z.coerce.number().int().positive().optional(),
  abilityId: z.coerce.number().int().positive().optional(),
  moveId: z.coerce.number().int().positive().optional(),
  language: z.enum(pokemonLanguageEnum.enumValues).optional(),
  ot: z.string().trim().max(100).optional(),
  trainerId: z.coerce.number().int().min(0).optional(),
  teraTypeId: z.coerce.number().int().positive().optional(),
  heldItemId: z.coerce.number().int().positive().optional(),
  levelMin: z.coerce.number().int().min(1).max(100).optional(),
  levelMax: z.coerce.number().int().min(1).max(100).optional(),
  favorite: boolQuery.optional(),
  locked: boolQuery.optional(),
  forTrade: boolQuery.optional(),
  loaned: boolQuery.optional(),
  competitive: boolQuery.optional(),
  ribbonMaster: boolQuery.optional(),
  tags: stringListQuery.optional(),
  labels: stringListQuery.optional(),
  sort: z
    .enum(["createdAt", "updatedAt", "level", "nickname", "nationalDex", "slot"])
    .default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  ...paginationQuery,
});

export type CreatePokemonBody = z.infer<typeof createPokemonBodySchema>;
export type UpdatePokemonBody = z.infer<typeof updatePokemonBodySchema>;
export type PokemonQuery = z.infer<typeof pokemonQuerySchema>;
