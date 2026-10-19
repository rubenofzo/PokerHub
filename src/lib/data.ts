import "server-only";
import { connection } from "next/server";
import { cache } from "react";
import { asc } from "drizzle-orm";
import { databaseUrl, getDb, schema } from "@/db";
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

/**
 * Explains, in plain words, why the database can't be read (missing env var, tables not
 * created yet, unreachable server), or returns null when everything works. The layout shows
 * this instead of crashing with a blank error page.
 */
export async function getSetupProblem(): Promise<string | null> {
  if (!databaseUrl()) {
    return "DATABASE_URL is not set. On Vercel, connect a Neon database under Storage, then redeploy.";
  }
  try {
    await getHub();
    return null;
  } catch (err) {
    console.error("[pokerhub] loading data failed:", err);
    const code = findCode(err);
    if (code === "42P01") {
      return "The database is connected but its tables don't exist yet. Redeploy so the build can create them (or run npm run db:migrate).";
    }
    if (code === "28P01" || code === "28000") return "The database rejected the login in DATABASE_URL.";
    if (code === "ENOTFOUND" || code === "ECONNREFUSED" || code === "ETIMEDOUT") {
      return "The database server in DATABASE_URL can't be reached.";
    }
    return "Loading data from the database failed. The Vercel function logs have the details.";
  }
}

function findCode(err: unknown): string | undefined {
  for (let e = err as { code?: unknown; cause?: unknown } | undefined, i = 0; e && i < 5; e = e.cause as typeof e, i++) {
    if (typeof e.code === "string") return e.code;
  }
  return undefined;
}
