import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { boxes } from "./boxes.js";
import {
  genderEnum,
  homePlanEnum,
  pokemonLanguageEnum,
  pokemonLocationEnum,
} from "./enums.js";
import {
  abilities,
  balls,
  forms,
  games,
  items,
  moves,
  natures,
  species,
  types,
} from "./reference.js";
import { originalTrainers } from "./trainers.js";
import { users } from "./users.js";

/**
 * One record = exactly one owned Pokémon.
 *
 * Notes:
 * - `tags` and `labels` are user-defined free-form string arrays stored on the
 *   row itself (all data is strictly user-owned, so a normalized tags table
 *   adds nothing). `tags` has a GIN index for search.
 * - Business rules enforced at the DB level where cheap:
 *   no held item while located in HOME, box/slot must be set together,
 *   one Pokémon per box slot.
 * - The remaining rules (e.g. location=home requires plan/box/slot) are
 *   enforced by API validation.
 */
export const pokemon = pgTable(
  "pokemon",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Identity
    speciesId: integer("species_id")
      .notNull()
      .references(() => species.id),
    formId: integer("form_id").references(() => forms.id),
    gender: genderEnum("gender").notNull().default("genderless"),
    isShiny: boolean("is_shiny").notNull().default(false),
    isAlpha: boolean("is_alpha").notNull().default(false),
    isGigantamax: boolean("is_gigantamax").notNull().default(false),
    dynamaxLevel: smallint("dynamax_level").notNull().default(0),
    teraTypeId: integer("tera_type_id").references(() => types.id),
    nickname: varchar("nickname", { length: 100 }),
    language: pokemonLanguageEnum("language"),
    level: smallint("level").notNull().default(1),

    // Origin
    originalTrainerId: uuid("original_trainer_id").references(
      () => originalTrainers.id,
      { onDelete: "set null" },
    ),
    otName: varchar("ot_name", { length: 100 }),
    trainerId: integer("trainer_id"),
    secretId: integer("secret_id"),
    originGameId: integer("origin_game_id").references(() => games.id),
    location: pokemonLocationEnum("location").notNull().default("home"),
    // Only set when location = 'home' (validated by the API)
    homePlan: homePlanEnum("home_plan"),
    boxId: uuid("box_id").references(() => boxes.id, { onDelete: "set null" }),
    slot: smallint("slot"),
    metLevel: smallint("met_level"),
    metLocation: varchar("met_location", { length: 150 }),
    metDate: date("met_date", { mode: "string" }),
    ballId: integer("ball_id").references(() => balls.id),
    isFatefulEncounter: boolean("is_fateful_encounter")
      .notNull()
      .default(false),

    // Battle
    natureId: integer("nature_id").references(() => natures.id),
    abilityId: integer("ability_id").references(() => abilities.id),
    isHiddenAbility: boolean("is_hidden_ability").notNull().default(false),
    heldItemId: integer("held_item_id").references(() => items.id),
    evHp: smallint("ev_hp"),
    evAttack: smallint("ev_attack"),
    evDefense: smallint("ev_defense"),
    evSpecialAttack: smallint("ev_special_attack"),
    evSpecialDefense: smallint("ev_special_defense"),
    evSpeed: smallint("ev_speed"),
    ivHp: smallint("iv_hp"),
    ivAttack: smallint("iv_attack"),
    ivDefense: smallint("iv_defense"),
    ivSpecialAttack: smallint("iv_special_attack"),
    ivSpecialDefense: smallint("iv_special_defense"),
    ivSpeed: smallint("iv_speed"),
    hyperTrainedHp: boolean("hyper_trained_hp").notNull().default(false),
    hyperTrainedAttack: boolean("hyper_trained_attack")
      .notNull()
      .default(false),
    hyperTrainedDefense: boolean("hyper_trained_defense")
      .notNull()
      .default(false),
    hyperTrainedSpecialAttack: boolean("hyper_trained_special_attack")
      .notNull()
      .default(false),
    hyperTrainedSpecialDefense: boolean("hyper_trained_special_defense")
      .notNull()
      .default(false),
    hyperTrainedSpeed: boolean("hyper_trained_speed")
      .notNull()
      .default(false),

    // Status
    isFavorite: boolean("is_favorite").notNull().default(false),
    isLocked: boolean("is_locked").notNull().default(false),
    isForTrade: boolean("is_for_trade").notNull().default(false),
    isLoaned: boolean("is_loaned").notNull().default(false),
    isCompetitive: boolean("is_competitive").notNull().default(false),
    isRibbonMaster: boolean("is_ribbon_master").notNull().default(false),

    // Misc
    notes: text("notes"),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    labels: text("labels")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("pokemon_user_id_idx").on(t.userId),
    index("pokemon_species_id_idx").on(t.speciesId),
    index("pokemon_box_id_idx").on(t.boxId),
    index("pokemon_location_idx").on(t.location),
    index("pokemon_tags_gin_idx").using("gin", t.tags),
    // One Pokémon per box slot
    uniqueIndex("pokemon_box_slot_unique")
      .on(t.boxId, t.slot)
      .where(sql`${t.boxId} IS NOT NULL AND ${t.slot} IS NOT NULL`),
    check(
      "pokemon_level_range",
      sql`${t.level} BETWEEN 1 AND 100`,
    ),
    check(
      "pokemon_dynamax_level_range",
      sql`${t.dynamaxLevel} BETWEEN 0 AND 10`,
    ),
    check("pokemon_slot_range", sql`${t.slot} IS NULL OR ${t.slot} BETWEEN 1 AND 30`),
    // Box and slot must always be set (or unset) together
    check(
      "pokemon_box_slot_pair",
      sql`(${t.boxId} IS NULL) = (${t.slot} IS NULL)`,
    ),
    // Scope rule: a Pokémon located in HOME cannot hold an item
    check(
      "pokemon_no_held_item_in_home",
      sql`${t.location} <> 'home' OR ${t.heldItemId} IS NULL`,
    ),
  ],
);

/**
 * A Pokémon's moveset (up to 4 moves) with per-move PP Ups.
 * Join table (instead of 4 fixed columns) so searching by move stays indexed.
 */
export const pokemonMoves = pgTable(
  "pokemon_moves",
  {
    pokemonId: uuid("pokemon_id")
      .notNull()
      .references(() => pokemon.id, { onDelete: "cascade" }),
    moveId: integer("move_id")
      .notNull()
      .references(() => moves.id),
    slot: smallint("slot").notNull(),
    ppUps: smallint("pp_ups").notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.pokemonId, t.slot] }),
    uniqueIndex("pokemon_moves_pokemon_move_unique").on(t.pokemonId, t.moveId),
    index("pokemon_moves_move_id_idx").on(t.moveId),
    check("pokemon_moves_slot_range", sql`${t.slot} BETWEEN 1 AND 4`),
    check("pokemon_moves_pp_ups_range", sql`${t.ppUps} BETWEEN 0 AND 3`),
  ],
);

export type Pokemon = typeof pokemon.$inferSelect;
export type NewPokemon = typeof pokemon.$inferInsert;
export type PokemonMove = typeof pokemonMoves.$inferSelect;
export type NewPokemonMove = typeof pokemonMoves.$inferInsert;
