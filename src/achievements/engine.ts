import type { HubStats, SessionResult } from "@/lib/stats";
import { achievements as defaultDefinitions } from "./definitions";
import type { AchievementContext, AchievementDefinition } from "./types";

export type RarityTier = "common" | "uncommon" | "rare" | "ultra";

export type Unlock = {
  achievementId: string;
  playerId: number;
  sessionId: number;
  date: string;
};

export type PlayerAchievement = {
  definition: AchievementDefinition;
  unlocked: Unlock | null;
  progress: [number, number] | null;
  rarity: number;
  tier: RarityTier;
};

export type AchievementSummary = {
  definition: AchievementDefinition;
  /** Share of players (with at least one session) who earned it, 0–1. */
  rarity: number;
  tier: RarityTier;
  unlocks: Unlock[];
};

export type AchievementResults = {
  summaries: AchievementSummary[];
  byPlayer: Map<number, PlayerAchievement[]>;
  /** Every unlock, newest first. */
  recent: Unlock[];
};

export function rarityTier(rarity: number): RarityTier {
  if (rarity > 0.5) return "common";
  if (rarity > 0.25) return "uncommon";
  if (rarity > 0.1) return "rare";
  return "ultra";
}

export const TIER_LABEL: Record<RarityTier, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  ultra: "Ultra rare",
};

/** Replays every session in order and records the first session each achievement was met. */
export function evaluateAchievements(
  stats: HubStats,
  definitions: AchievementDefinition[] = defaultDefinitions,
): AchievementResults {
  const players = stats.players.map((s) => s.player);
  const histories = new Map<number, SessionResult[]>();
  const totals = new Map<number, number>();
  const everNegative = new Map<number, boolean>();
  const winStreak = new Map<number, number>();
  const lossStreak = new Map<number, number>();
  const attendStreak = new Map<number, number>();
  const unlocked = new Map<string, Unlock>(); // key: `${achievementId}:${playerId}`
  const lastContext = new Map<number, AchievementContext>();

  for (const session of stats.sessions) {
    const nets = session.results.map((r) => r.netCents);
    const top = Math.max(...nets);
    const bottom = Math.min(...nets);
    const averageIn = session.results.reduce((s, r) => s + r.moneyInCents, 0) / session.results.length;
    const previousTotals = new Map(totals);

    for (const r of session.results) {
      histories.set(r.playerId, [...(histories.get(r.playerId) ?? []), r]);
      totals.set(r.playerId, (totals.get(r.playerId) ?? 0) + r.netCents);
      winStreak.set(r.playerId, r.netCents > 0 ? (winStreak.get(r.playerId) ?? 0) + 1 : 0);
      lossStreak.set(r.playerId, r.netCents < 0 ? (lossStreak.get(r.playerId) ?? 0) + 1 : 0);
    }

    const active = players.filter((p) => histories.has(p.id));
    const ranking = [...active].sort((a, b) => (totals.get(b.id) ?? 0) - (totals.get(a.id) ?? 0));
    const rankOf = (id: number) => {
      const total = totals.get(id) ?? 0;
      return ranking.findIndex((p) => (totals.get(p.id) ?? 0) === total) + 1;
    };

    for (const player of active) {
      const result = session.results.find((r) => r.playerId === player.id) ?? null;
      attendStreak.set(player.id, result ? (attendStreak.get(player.id) ?? 0) + 1 : 0);
      const ctx: AchievementContext = {
        player,
        session,
        result,
        history: histories.get(player.id) ?? [],
        sessionsPlayed: histories.get(player.id)?.length ?? 0,
        totalNetCents: totals.get(player.id) ?? 0,
        previousTotalNetCents: previousTotals.get(player.id) ?? 0,
        wasEverNegative: everNegative.get(player.id) ?? false,
        winStreak: winStreak.get(player.id) ?? 0,
        lossStreak: lossStreak.get(player.id) ?? 0,
        attendanceStreak: attendStreak.get(player.id) ?? 0,
        rank: rankOf(player.id),
        playerCount: active.length,
        isBiggestWinner: !!result && result.netCents > 0 && result.netCents === top,
        isBiggestLoser: !!result && result.netCents < 0 && result.netCents === bottom,
        sessionAverageInCents: averageIn,
      };
      lastContext.set(player.id, ctx);

      for (const def of definitions) {
        const key = `${def.id}:${player.id}`;
        if (unlocked.has(key)) continue;
        if (safeCheck(def, ctx)) {
          unlocked.set(key, {
            achievementId: def.id,
            playerId: player.id,
            sessionId: session.id,
            date: session.date,
          });
        }
      }
    }

    for (const player of active) {
      if ((totals.get(player.id) ?? 0) < 0) everNegative.set(player.id, true);
    }
  }

  const playerCount = players.length;
  const summaries: AchievementSummary[] = definitions.map((definition) => {
    const unlocks = [...unlocked.values()].filter((u) => u.achievementId === definition.id);
    const rarity = playerCount ? unlocks.length / playerCount : 0;
    return { definition, rarity, tier: rarityTier(rarity), unlocks };
  });
  const summaryById = new Map(summaries.map((s) => [s.definition.id, s]));

  const byPlayer = new Map<number, PlayerAchievement[]>();
  for (const player of players) {
    const ctx = lastContext.get(player.id);
    byPlayer.set(
      player.id,
      definitions.map((definition) => {
        const summary = summaryById.get(definition.id)!;
        const unlock = unlocked.get(`${definition.id}:${player.id}`) ?? null;
        let progress: [number, number] | null = null;
        if (!unlock && definition.progress && ctx) {
          const [current, target] = definition.progress(ctx);
          progress = [Math.min(current, target), target];
        }
        return { definition, unlocked: unlock, progress, rarity: summary.rarity, tier: summary.tier };
      }),
    );
  }

  const order = new Map(stats.sessions.map((s, i) => [s.id, i]));
  const recent = [...unlocked.values()].sort(
    (a, b) => (order.get(b.sessionId) ?? 0) - (order.get(a.sessionId) ?? 0),
  );

  return { summaries, byPlayer, recent };
}

/** A broken check shouldn't take the whole site down; it just never unlocks. */
function safeCheck(def: AchievementDefinition, ctx: AchievementContext): boolean {
  try {
    return def.check(ctx);
  } catch (err) {
    console.error(`Achievement "${def.id}" threw:`, err);
    return false;
  }
}
