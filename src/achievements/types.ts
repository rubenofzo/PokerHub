import type { PlayerRecord, SessionResult, SessionSummary } from "@/lib/stats";

/**
 * Everything an achievement can look at. The engine builds one of these for every player
 * after every session (in date order), so a check sees the world as it was at that moment.
 */
export type AchievementContext = {
  player: PlayerRecord;
  /** The session that just finished. */
  session: SessionSummary;
  /** This player's result in that session, or null if they sat it out. */
  result: SessionResult | null;
  /** All of this player's results so far, oldest first (includes `result`). */
  history: SessionResult[];
  sessionsPlayed: number;
  /** All-time net in cents after this session, and before it. */
  totalNetCents: number;
  previousTotalNetCents: number;
  /** Whether the all-time net was ever below zero before this session. */
  wasEverNegative: boolean;
  /** Current run of sessions won / lost in a row (sessions they skipped don't break it). */
  winStreak: number;
  lossStreak: number;
  /** Current run of consecutive group sessions attended. */
  attendanceStreak: number;
  /** All-time rank after this session (1 = top), among everyone who has played. */
  rank: number;
  playerCount: number;
  /** Highest and lowest net of this session (ties share the title). */
  isBiggestWinner: boolean;
  isBiggestLoser: boolean;
  /** Average money in per player for this session. */
  sessionAverageInCents: number;
};

export type AchievementDefinition = {
  /** Stable id; don't change it once used, or everyone "loses" and re-earns it. */
  id: string;
  name: string;
  description: string;
  /**
   * Shown in the badge: one or two characters (a letter, a symbol like ♠ or an emoji),
   * or a path to an image in /public such as "/achievements/shark.png".
   */
  icon: string;
  /** Hidden achievements show as ??? until someone earns them. */
  hidden?: boolean;
  /** True once the player has earned it. Called after every session. */
  check: (ctx: AchievementContext) => boolean;
  /** Optional progress for the locked view, e.g. [7, 10]. */
  progress?: (ctx: AchievementContext) => [current: number, target: number];
};
