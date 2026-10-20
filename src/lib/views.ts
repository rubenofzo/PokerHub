import type { AchievementResults, PlayerAchievement } from "@/achievements/engine";
import type { AchievementView, AchievementWinner } from "@/components/AchievementDetail";
import type { ChartPoint, ChartSeries } from "@/components/BalanceChart";
import type { StatsRow } from "@/components/StatsTable";
import { formatDate, playerColors } from "./format";
import { centsToEuros } from "./money";
import type { HubStats, PlayerStats } from "./stats";

/**
 * The one source for player colours: the chart palette in alphabetical order, so the chart
 * lines and the PlayerDots on every page match.
 */
export function playerColorMap(stats: HubStats): Map<number, string> {
  const alphabetical = [...stats.players].sort((a, b) => a.player.name.localeCompare(b.player.name));
  return playerColors(alphabetical.map((p) => p.player.id));
}

/** Chart data for the given players (all by default), one line each. */
export function chartData(stats: HubStats, only?: PlayerStats[]): { points: ChartPoint[]; series: ChartSeries[] } {
  const players = only ?? stats.players;
  const colors = playerColorMap(stats);
  const series = players.map((p) => ({
    key: p.player.slug,
    name: p.player.name,
    color: colors.get(p.player.id) ?? "#e2c27e",
  }));
  const points = stats.timeline.map((t) => {
    const point: ChartPoint = { label: t.label };
    for (const p of players) point[p.player.slug] = centsToEuros(t.balances[p.player.id] ?? 0);
    return point;
  });
  return { points, series };
}

export function statsRows(stats: HubStats): StatsRow[] {
  return stats.players.map((p) => ({
    slug: p.player.slug,
    name: p.player.name,
    rank: p.rank,
    net: p.netCents,
    sessions: p.sessionsPlayed,
    average: p.averageCents,
    winRate: p.winRate,
    roi: p.roi,
    best: p.biggestWin?.netCents ?? 0,
    worst: p.biggestLoss?.netCents ?? 0,
    bestStreak: p.bestWinStreak,
    worstStreak: p.worstLossStreak,
    rebuys: p.rebuys,
    swing: p.swingCents,
    attendance: p.attendance,
  }));
}

/** Who unlocked each achievement, oldest unlock first, ready for the client components. */
function winnersById(stats: HubStats, achievements: AchievementResults): Map<string, AchievementWinner[]> {
  const colors = playerColorMap(stats);
  const players = new Map(stats.players.map((p) => [p.player.id, p.player]));
  const order = new Map(stats.sessions.map((s, i) => [s.id, i]));
  return new Map(
    achievements.summaries.map((s) => [
      s.definition.id,
      [...s.unlocks]
        .sort((a, b) => (order.get(a.sessionId) ?? 0) - (order.get(b.sessionId) ?? 0))
        .flatMap((u) => {
          const p = players.get(u.playerId);
          if (!p) return [];
          return [
            {
              playerId: p.id,
              name: p.name,
              slug: p.slug,
              color: colors.get(p.id) ?? "#e2c27e",
              date: formatDate(u.date),
              sessionId: u.sessionId,
            },
          ];
        }),
    ]),
  );
}

/** Hidden and still locked: strip everything that would give it away before it reaches the client. */
function redact(view: AchievementView, index: number): AchievementView {
  return view.secret
    ? { ...view, id: `hidden-${index}`, name: "???", description: "", icon: "?", progress: null, winners: [] }
    : view;
}

/** Every achievement as seen by the group: locked when nobody has it yet. */
export function achievementViews(stats: HubStats, achievements: AchievementResults): AchievementView[] {
  const winners = winnersById(stats, achievements);
  return achievements.summaries.map((s, i) => {
    const locked = s.unlocks.length === 0;
    return redact({
      id: s.definition.id,
      name: s.definition.name,
      description: s.definition.description,
      icon: s.definition.icon,
      tier: s.tier,
      rarity: s.rarity,
      locked,
      secret: locked && !!s.definition.hidden,
      progress: null,
      winners: winners.get(s.definition.id) ?? [],
      unlockedDate: null,
      unlockedSessionId: null,
      unlockedOrder: null,
    }, i);
  });
}

/** Every achievement as seen by one player: locked until they have it, with their progress. */
export function playerAchievementViews(
  stats: HubStats,
  achievements: AchievementResults,
  playerId: number,
): AchievementView[] {
  const winners = winnersById(stats, achievements);
  const order = new Map(stats.sessions.map((s, i) => [s.id, i]));
  return (achievements.byPlayer.get(playerId) ?? []).map((a: PlayerAchievement, i) =>
    redact({
      id: a.definition.id,
      name: a.definition.name,
      description: a.definition.description,
      icon: a.definition.icon,
      tier: a.tier,
      rarity: a.rarity,
      locked: !a.unlocked,
      secret: !a.unlocked && !!a.definition.hidden,
      progress: a.progress,
      winners: winners.get(a.definition.id) ?? [],
      unlockedDate: a.unlocked ? formatDate(a.unlocked.date) : null,
      unlockedSessionId: a.unlocked?.sessionId ?? null,
      unlockedOrder: a.unlocked ? (order.get(a.unlocked.sessionId) ?? null) : null,
    }, i),
  );
}
