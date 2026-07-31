import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { goalTypeEnum, historyActionEnum } from "./enums.js";
import { pokemon } from "./pokemon.js";
import { users } from "./users.js";

/**
 * Free-form user notes, optionally attached to a Pokémon.
 */
export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    pokemonId: uuid("pokemon_id").references(() => pokemon.id, {
      onDelete: "cascade",
    }),
    title: varchar("title", { length: 150 }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("notes_user_id_idx").on(t.userId),
    index("notes_pokemon_id_idx").on(t.pokemonId),
  ],
);

/**
 * Built-in (e.g. Living Dex) and custom collection goals.
 * `config` holds the goal definition (filters, targets) as JSON so new goal
 * types don't require schema changes.
 */
export const goals = pgTable(
  "goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: goalTypeEnum("type").notNull().default("custom"),
    name: varchar("name", { length: 150 }).notNull(),
    description: text("description"),
    config: jsonb("config")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    isCompleted: boolean("is_completed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("goals_user_id_idx").on(t.userId)],
);

export const savedSearches = pgTable(
  "saved_searches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 150 }).notNull(),
    criteria: jsonb("criteria").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("saved_searches_user_id_idx").on(t.userId)],
);

/**
 * Audit log of everything that happens in a user's collection.
 * `pokemonId` is set-null on delete so history survives Pokémon removal.
 */
export const history = pgTable(
  "history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    pokemonId: uuid("pokemon_id").references(() => pokemon.id, {
      onDelete: "set null",
    }),
    action: historyActionEnum("action").notNull(),
    summary: text("summary"),
    changes: jsonb("changes").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("history_user_id_idx").on(t.userId),
    index("history_pokemon_id_idx").on(t.pokemonId),
    index("history_created_at_idx").on(t.createdAt),
  ],
);

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;
export type SavedSearch = typeof savedSearches.$inferSelect;
export type NewSavedSearch = typeof savedSearches.$inferInsert;
export type HistoryEntry = typeof history.$inferSelect;
export type NewHistoryEntry = typeof history.$inferInsert;
