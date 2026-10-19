import type { ChartPoint, ChartSeries } from "@/components/BalanceChart";
import type { StatsRow } from "@/components/StatsTable";
import { playerColors } from "./format";
import { centsToEuros } from "./money";
import type { HubStats, PlayerStats } from "./stats";

/** Chart data for the given players (all by default), one line each. */
export function chartData(stats: HubStats, only?: PlayerStats[]): { points: ChartPoint[]; series: ChartSeries[] } {
  const players = only ?? stats.players;
  const alphabetical = [...stats.players].sort((a, b) => a.player.name.localeCompare(b.player.name));
  const colors = playerColors(alphabetical.map((p) => p.player.id));
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
