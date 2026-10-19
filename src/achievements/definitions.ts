import type { AchievementDefinition } from "./types";

/**
 * The achievement list. To add one, copy an entry, give it a new `id`, and write its
 * `check`. Everything is recalculated from the session history, so new or changed
 * achievements apply to past sessions too. See README → "Adding an achievement".
 */
export const achievements: AchievementDefinition[] = [
  {
    id: "first-hand",
    name: "First Hand",
    description: "Play your first session.",
    icon: "♠",
    check: (c) => c.sessionsPlayed >= 1,
  },
  {
    id: "regular",
    name: "Regular",
    description: "Play 10 sessions.",
    icon: "10",
    check: (c) => c.sessionsPlayed >= 10,
    progress: (c) => [c.sessionsPlayed, 10],
  },
  {
    id: "veteran",
    name: "Veteran",
    description: "Play 25 sessions.",
    icon: "25",
    check: (c) => c.sessionsPlayed >= 25,
    progress: (c) => [c.sessionsPlayed, 25],
  },
  {
    id: "in-the-green",
    name: "In the Green",
    description: "Finish a session in profit.",
    icon: "+",
    check: (c) => (c.result?.netCents ?? 0) > 0,
  },
  {
    id: "double-up",
    name: "Double Up",
    description: "Cash out at least twice your buy-in in one session.",
    icon: "2×",
    check: (c) =>
      !!c.result && c.result.moneyInCents > 0 && c.result.moneyOutCents >= 2 * c.result.moneyInCents,
  },
  {
    id: "busted",
    name: "Busted",
    description: "Leave a session with nothing.",
    icon: "0",
    check: (c) => !!c.result && c.result.moneyInCents > 0 && c.result.moneyOutCents === 0,
  },
  {
    id: "dead-even",
    name: "Dead Even",
    description: "Cash out exactly what you put in.",
    icon: "=",
    check: (c) => !!c.result && c.result.moneyInCents > 0 && c.result.moneyOutCents === c.result.moneyInCents,
  },
  {
    id: "shark",
    name: "Shark",
    description: "Be the biggest winner of a session.",
    icon: "S",
    check: (c) => c.isBiggestWinner,
  },
  {
    id: "donor",
    name: "Donor",
    description: "Be the biggest loser of a session.",
    icon: "D",
    check: (c) => c.isBiggestLoser,
  },
  {
    id: "hot-streak",
    name: "Hot Streak",
    description: "Win 3 sessions in a row.",
    icon: "♦",
    check: (c) => c.winStreak >= 3,
    progress: (c) => [c.winStreak, 3],
  },
  {
    id: "ice-cold",
    name: "Ice Cold",
    description: "Lose 5 sessions in a row.",
    icon: "❄",
    hidden: true,
    check: (c) => c.lossStreak >= 5,
  },
  {
    id: "comeback-kid",
    name: "Comeback Kid",
    description: "Climb from a negative all-time balance back into profit.",
    icon: "↗",
    check: (c) => c.wasEverNegative && c.totalNetCents > 0,
  },
  {
    id: "king-of-the-table",
    name: "King of the Table",
    description: "Be number one on the all-time leaderboard after a session.",
    icon: "K",
    check: (c) => c.playerCount > 1 && c.rank === 1,
  },
  {
    id: "ironman",
    name: "Ironman",
    description: "Attend 10 sessions in a row.",
    icon: "∞",
    check: (c) => c.attendanceStreak >= 10,
    progress: (c) => [c.attendanceStreak, 10],
  },
  {
    id: "high-roller",
    name: "High Roller",
    description: "Buy in for at least 3× the table average in one session.",
    icon: "♣",
    check: (c) =>
      !!c.result &&
      c.session.results.length > 1 &&
      c.sessionAverageInCents > 0 &&
      c.result.moneyInCents >= 3 * c.sessionAverageInCents,
  },
  {
    id: "century",
    name: "Century",
    description: "Reach +€100 all-time.",
    icon: "€",
    check: (c) => c.totalNetCents >= 10000,
    progress: (c) => [Math.max(0, Math.floor(c.totalNetCents / 100)), 100],
  },
];
