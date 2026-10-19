import "server-only";
import { connection } from "next/server";
import { cache } from "react";
import { asc } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { evaluateAchievements } from "@/achievements/engine";
import { computeStats, type RawSession } from "./stats";

/**
 * Loads everything once per request and derives all stats from it. The data set is tiny
 * (a few hundred rows a year), so computing on the fly keeps edits and new achievements
 * retroactive without any caching to invalidate.
 */
export const getHub = cache(async () => {
  await connection();
  const db = getDb();
  const [players, sessions, results, aliases] = await Promise.all([
    db.select().from(schema.players).orderBy(asc(schema.players.name)),
    db.select().from(schema.sessions),
    db.select().from(schema.results),
    db.select().from(schema.playerAliases),
  ]);

  const raw: RawSession[] = sessions.map((s) => ({
    id: s.id,
    date: s.date,
    note: s.note,
    results: results.filter((r) => r.sessionId === s.id),
  }));
  const playerRecords = players.map((p) => ({ id: p.id, name: p.name, slug: p.slug }));
  const stats = computeStats(playerRecords, raw);
  const achievements = evaluateAchievements(stats);

  return {
    allPlayers: playerRecords,
    aliases,
    sessionsMeta: new Map(sessions.map((s) => [s.id, s])),
    stats,
    achievements,
    playerById: new Map(playerRecords.map((p) => [p.id, p])),
  };
});

export type Hub = Awaited<ReturnType<typeof getHub>>;
