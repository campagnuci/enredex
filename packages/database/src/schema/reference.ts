import {
  boolean,
  integer,
  serial,
  smallint,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import {
  battleStatEnum,
  damageClassEnum,
  formTypeEnum,
  regionalFormEnum,
} from "./enums.js";

export const generations = pgTable("generations", {
  id: serial("id").primaryKey(),
  number: smallint("number").notNull().unique(),
  name: varchar("name", { length: 50 }).notNull().unique(),
});

export const regions = pgTable("regions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  generationId: integer("generation_id").references(() => generations.id),
});

/**
 * Reference data versioning columns (scope: "Reference Data Versioning").
 * Applied to every imported reference entity so future generations can be
 * imported without breaking existing collections.
 */
const versioningColumns = {
  generationId: integer("generation_id").references(() => generations.id),
  introducedGameId: integer("introduced_game_id").references(() => games.id),
  introducedVersion: varchar("introduced_version", { length: 50 }),
  lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

export const types = pgTable("types", {
  id: serial("id").primaryKey(),
  pokeapiId: integer("pokeapi_id").unique(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  ...versioningColumns,
});

export const abilities = pgTable("abilities", {
  id: serial("id").primaryKey(),
  pokeapiId: integer("pokeapi_id").unique(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  ...versioningColumns,
});

export const moves = pgTable("moves", {
  id: serial("id").primaryKey(),
  pokeapiId: integer("pokeapi_id").unique(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  typeId: integer("type_id").references(() => types.id),
  damageClass: damageClassEnum("damage_class"),
  power: smallint("power"),
  pp: smallint("pp"),
  accuracy: smallint("accuracy"),
  ...versioningColumns,
});

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  pokeapiId: integer("pokeapi_id").unique(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  category: varchar("category", { length: 100 }),
  ...versioningColumns,
});

export const balls = pgTable("balls", {
  id: serial("id").primaryKey(),
  pokeapiId: integer("pokeapi_id").unique(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  ...versioningColumns,
});

export const natures = pgTable("natures", {
  id: serial("id").primaryKey(),
  pokeapiId: integer("pokeapi_id").unique(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  increasedStat: battleStatEnum("increased_stat"),
  decreasedStat: battleStatEnum("decreased_stat"),
  ...versioningColumns,
});

export const species = pgTable("species", {
  id: serial("id").primaryKey(),
  pokeapiId: integer("pokeapi_id").unique(),
  nationalDexNumber: integer("national_dex_number").notNull().unique(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  isLegendary: boolean("is_legendary").notNull().default(false),
  isMythical: boolean("is_mythical").notNull().default(false),
  ...versioningColumns,
});

export const forms = pgTable(
  "forms",
  {
    id: serial("id").primaryKey(),
    speciesId: integer("species_id")
      .notNull()
      .references(() => species.id, { onDelete: "cascade" }),
    pokeapiId: integer("pokeapi_id").unique(),
    name: varchar("name", { length: 100 }).notNull(),
    formType: formTypeEnum("form_type").notNull().default("standard"),
    regionalForm: regionalFormEnum("regional_form"),
    isDefault: boolean("is_default").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    ...versioningColumns,
  },
  (t) => [unique("forms_species_name_unique").on(t.speciesId, t.name)],
);

export type Generation = typeof generations.$inferSelect;
export type Region = typeof regions.$inferSelect;
export type Game = typeof games.$inferSelect;
export type Type = typeof types.$inferSelect;
export type Ability = typeof abilities.$inferSelect;
export type Move = typeof moves.$inferSelect;
export type Item = typeof items.$inferSelect;
export type Ball = typeof balls.$inferSelect;
export type Nature = typeof natures.$inferSelect;
export type Species = typeof species.$inferSelect;
export type Form = typeof forms.$inferSelect;

export type NewSpecies = typeof species.$inferInsert;
export type NewForm = typeof forms.$inferInsert;
export type NewType = typeof types.$inferInsert;
export type NewAbility = typeof abilities.$inferInsert;
export type NewMove = typeof moves.$inferInsert;
export type NewItem = typeof items.$inferInsert;
export type NewBall = typeof balls.$inferInsert;
export type NewNature = typeof natures.$inferInsert;
export type NewGame = typeof games.$inferInsert;
