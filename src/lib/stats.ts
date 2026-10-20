/**
 * The stats engine: pure functions that turn raw session results into everything the
 * site shows. Nothing here touches the database, so every number is easy to test and
 * any change (an edited session, a new achievement) applies to the whole history.
 */

export const DEFAULT_BUY_IN_CENTS = 500;

export type PlayerRecord = { id: number; name: string; slug: string };

export type RawResult = {
  playerId: number;
  moneyInCents: number;
  moneyOutCents: number;
  buyIns: number | null;
};

export type RawSession = {
  id: number;
  date: string; // YYYY-MM-DD
  note: string | null;
  results: RawResult[];
};

export type SessionResult = {
  playerId: number;
  moneyInCents: number;
  moneyOutCents: number;
  /** From the sheet, or money in ÷ €5 rounded when the sheet had no Buy-ins column. */
  buyIns: number;
  buyInsInferred: boolean;
  /** This player's part of the session's imbalance, so the session sums to zero. */
  correctionCents: number;
  /** Money out − money in + correction. */
  netCents: number;
};

export type SessionSummary = {
  id: number;
  date: string;
  note: string | null;
  /** 1-based position in date order. */
  number: number;
  potCents: number;
  /** Total money in − total money out, before correction. Positive means money went missing. */
  imbalanceCents: number;
  /** Sorted best result first. */
  results: SessionResult[];
};

export type PlayerSessionEntry = SessionResult & {
  sessionId: number;
  date: string;
  sessionNumber: number;
  cumulativeCents: number;
};

export type PlayerStats = {
  player: PlayerRecord;
  rank: number;
  netCents: number;
  sessionsPlayed: number;
  averageCents: number;
  /** Share of sessions finished in profit, 0–1. */
  winRate: number;
  /** Total cashed out ÷ total bought in (after correction); null without any money in. */
  roi: number | null;
  biggestWin: PlayerSessionEntry | null;
  biggestLoss: PlayerSessionEntry | null;
  bestWinStreak: number;
  worstLossStreak: number;
  rebuys: number;
  /** Standard deviation of session results, in cents. */
  swingCents: number;
  /** Share of all sessions attended, 0–1. */
  attendance: number;
  totalInCents: number;
  history: PlayerSessionEntry[];
};

export type TimelinePoint = {
  sessionId: number | null;
  date: string | null;
  label: string;
  /** Cumulative net per player id after this point (0 before their first session). */
  balances: Record<number, number>;
};

export type HubStats = {
  players: PlayerStats[];
  sessions: SessionSummary[];
  timeline: TimelinePoint[];
};

export function inferBuyIns(moneyInCents: number): number {
  return Math.round(moneyInCents / DEFAULT_BUY_IN_CENTS);
}

/**
 * Spreads `imbalanceCents` evenly over the players, in name order, so each gets the same
 * share and leftover cents go one each to the first players alphabetically.
 */
export function spreadImbalance(
  imbalanceCents: number,
  playerIdsInNameOrder: number[],
): Map<number, number> {
  const shares = new Map<number, number>();
  const n = playerIdsInNameOrder.length;
  if (n === 0) return shares;
  const base = Math.trunc(imbalanceCents / n);
  let remainder = imbalanceCents - base * n;
  const step = Math.sign(remainder);
  for (const id of playerIdsInNameOrder) {
    let share = base;
    if (remainder !== 0) {
      share += step;
      remainder -= step;
    }
    shares.set(id, share);
  }
  return shares;
}

export function sortSessions<T extends { date: string; id: number }>(sessions: T[]): T[] {
  return [...sessions].sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
}

export function summarizeSession(
  session: RawSession,
  number: number,
  playersById: Map<number, PlayerRecord>,
): SessionSummary {
  const nameOf = (id: number) => playersById.get(id)?.name ?? "";
  const totalIn = session.results.reduce((s, r) => s + r.moneyInCents, 0);
  const totalOut = session.results.reduce((s, r) => s + r.moneyOutCents, 0);
  const imbalance = totalIn - totalOut;
  const order = [...session.results]
    .sort((a, b) => nameOf(a.playerId).localeCompare(nameOf(b.playerId), "nl", { sensitivity: "base" }))
    .map((r) => r.playerId);
  const shares = spreadImbalance(imbalance, order);

  const results: SessionResult[] = session.results.map((r) => {
    const correction = shares.get(r.playerId) ?? 0;
    return {
      playerId: r.playerId,
      moneyInCents: r.moneyInCents,
      moneyOutCents: r.moneyOutCents,
      buyIns: r.buyIns ?? inferBuyIns(r.moneyInCents),
      buyInsInferred: r.buyIns === null,
      correctionCents: correction,
      netCents: r.moneyOutCents - r.moneyInCents + correction,
    };
  });
  results.sort((a, b) => b.netCents - a.netCents || nameOf(a.playerId).localeCompare(nameOf(b.playerId)));

  return {
    id: session.id,
    date: session.date,
    note: session.note,
    number,
    potCents: totalIn,
    imbalanceCents: imbalance,
    results,
  };
}

function stdev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function longestRun<T>(items: T[], predicate: (item: T) => boolean): number {
  let best = 0;
  let current = 0;
  for (const item of items) {
    current = predicate(item) ? current + 1 : 0;
    best = Math.max(best, current);
  }
  return best;
}

export function formatSessionLabel(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function computeStats(players: PlayerRecord[], rawSessions: RawSession[]): HubStats {
  const playersById = new Map(players.map((p) => [p.id, p]));
  // Upcoming sessions have no results yet; they don't count towards numbering or attendance.
  const played = rawSessions.filter((s) => s.results.length > 0);
  const sessions = sortSessions(played).map((s, i) => summarizeSession(s, i + 1, playersById));

  const histories = new Map<number, PlayerSessionEntry[]>();
  const running = new Map<number, number>();
  const timeline: TimelinePoint[] = [
    { sessionId: null, date: null, label: "Start", balances: Object.fromEntries(players.map((p) => [p.id, 0])) },
  ];

  for (const session of sessions) {
    for (const r of session.results) {
      const cumulative = (running.get(r.playerId) ?? 0) + r.netCents;
      running.set(r.playerId, cumulative);
      const list = histories.get(r.playerId) ?? [];
      list.push({
        ...r,
        sessionId: session.id,
        date: session.date,
        sessionNumber: session.number,
        cumulativeCents: cumulative,
      });
      histories.set(r.playerId, list);
    }
    timeline.push({
      sessionId: session.id,
      date: session.date,
      label: formatSessionLabel(session.date),
      balances: Object.fromEntries(players.map((p) => [p.id, running.get(p.id) ?? 0])),
    });
  }

  const stats: PlayerStats[] = players
    .filter((p) => histories.has(p.id))
    .map((player) => {
      const history = histories.get(player.id)!;
      const nets = history.map((h) => h.netCents);
      const netCents = nets.reduce((s, v) => s + v, 0);
      const totalIn = history.reduce((s, h) => s + h.moneyInCents, 0);
      const wins = history.filter((h) => h.netCents > 0).length;
      const best = history.reduce<PlayerSessionEntry | null>(
        (b, h) => (h.netCents > 0 && (!b || h.netCents > b.netCents) ? h : b),
        null,
      );
      const worst = history.reduce<PlayerSessionEntry | null>(
        (b, h) => (h.netCents < 0 && (!b || h.netCents < b.netCents) ? h : b),
        null,
      );
      return {
        player,
        rank: 0,
        netCents,
        sessionsPlayed: history.length,
        averageCents: Math.round(netCents / history.length),
        winRate: wins / history.length,
        roi: totalIn > 0 ? (totalIn + netCents) / totalIn : null,
        biggestWin: best,
        biggestLoss: worst,
        bestWinStreak: longestRun(history, (h) => h.netCents > 0),
        worstLossStreak: longestRun(history, (h) => h.netCents < 0),
        rebuys: history.reduce((s, h) => s + Math.max(0, h.buyIns - 1), 0),
        swingCents: Math.round(stdev(nets)),
        attendance: sessions.length ? history.length / sessions.length : 0,
        totalInCents: totalIn,
        history,
      };
    });

  stats.sort((a, b) => b.netCents - a.netCents || a.player.name.localeCompare(b.player.name));
  stats.forEach((s, i) => {
    // Equal nets share a rank.
    s.rank = i > 0 && stats[i - 1].netCents === s.netCents ? stats[i - 1].rank : i + 1;
  });

  return { players: stats, sessions, timeline };
}
