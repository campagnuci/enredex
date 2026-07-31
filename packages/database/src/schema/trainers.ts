import {
  index,
  integer,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { games } from "./reference.js";
import { users } from "./users.js";

/**
 * Personal OT (Original Trainer) library.
 * OTs are private and never visible to other users.
 */
export const originalTrainers = pgTable(
  "original_trainers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gameId: integer("game_id")
      .notNull()
      .references(() => games.id),
    name: varchar("name", { length: 100 }).notNull(),
    trainerId: integer("trainer_id").notNull(),
    secretId: integer("secret_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("original_trainers_user_id_idx").on(t.userId),
    unique("original_trainers_user_game_name_tid_unique").on(
      t.userId,
      t.gameId,
      t.name,
      t.trainerId,
    ),
  ],
);

export type OriginalTrainer = typeof originalTrainers.$inferSelect;
export type NewOriginalTrainer = typeof originalTrainers.$inferInsert;
