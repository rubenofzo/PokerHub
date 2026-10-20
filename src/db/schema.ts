import {
  date,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  time,
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

/**
 * A session is upcoming while it has no results and played once it has any (no status column,
 * so the two can't disagree). Played sessions always have a date; an upcoming one may not yet.
 */
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  /** Null while the date is TBD. */
  date: date("date", { mode: "string" }),
  /** Start time in Europe/Amsterdam ("20:00:00"); null while the time is TBD. */
  startTime: time("start_time"),
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

/** Players who said they're coming to an upcoming session. Cleared once results are uploaded. */
export const signups = pgTable(
  "signups",
  {
    sessionId: integer("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    playerId: integer("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.sessionId, t.playerId] })],
);
