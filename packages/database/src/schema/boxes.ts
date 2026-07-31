import {
  index,
  integer,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";

/**
 * Pokémon HOME-style boxes. Each box has 30 slots in a 6x5 grid.
 * Plan limits (free = 1 box, premium = 200 boxes) are enforced by the API.
 */
export const boxes = pgTable(
  "boxes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("boxes_user_id_idx").on(t.userId),
    unique("boxes_user_position_unique").on(t.userId, t.position),
  ],
);

export type Box = typeof boxes.$inferSelect;
export type NewBox = typeof boxes.$inferInsert;
