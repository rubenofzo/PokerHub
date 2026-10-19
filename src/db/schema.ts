import {
  date,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Alternative spellings that map to a player, stored normalized (see normalizeName). */
export const playerAliases = pgTable("player_aliases", {
  alias: text("alias").primaryKey(),
  playerId: integer("player_id")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  date: date("date", { mode: "string" }).notNull(),
  note: text("note"),
  sourceFilename: text("source_filename"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const results = pgTable(
  "results",
  {
    sessionId: integer("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    playerId: integer("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    moneyInCents: integer("money_in_cents").notNull(),
    moneyOutCents: integer("money_out_cents").notNull(),
    /** Null when the sheet had no Buy-ins column; the stats engine then infers it. */
    buyIns: integer("buy_ins"),
  },
  (t) => [primaryKey({ columns: [t.sessionId, t.playerId] })],
);
