import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { authTokenTypeEnum, homePlanEnum } from "./enums.js";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  avatarUrl: text("avatar_url"),
  homePlan: homePlanEnum("home_plan").notNull().default("free"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    userAgent: text("user_agent"),
    ip: varchar("ip", { length: 45 }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("refresh_tokens_user_id_idx").on(t.userId)],
);

export const authTokens = pgTable(
  "auth_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: authTokenTypeEnum("type").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("auth_tokens_user_id_idx").on(t.userId)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;
export type AuthToken = typeof authTokens.$inferSelect;
export type NewAuthToken = typeof authTokens.$inferInsert;
