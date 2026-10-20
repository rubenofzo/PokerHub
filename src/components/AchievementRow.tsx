import clsx from "clsx";
import Link from "next/link";
import { TIER_LABEL } from "@/achievements/engine";
import { formatPercent } from "@/lib/format";
import { AchievementDetailTrigger, type AchievementView } from "./AchievementDetail";
import { Badge } from "./Badge";
import { PlayerDot, TIER_TEXT } from "./ui";

/** "Tijs, Sam +1 more", "Everyone" or "Nobody yet", for the one-line winners on phones. */
function winnersSummary(names: string[], playerCount?: number): string {
  if (names.length === 0) return "Nobody yet";
  if (playerCount && names.length >= playerCount && names.length > 2) return "Everyone";
  if (names.length <= 2) return names.join(", ");
  return `${names.slice(0, 2).join(", ")} +${names.length - 2} more`;
}

/**
 * One achievement in a list on an ivory card. The whole row opens `AchievementDetail` (it must
 * sit inside an `AchievementDetailProvider`). `context="group"` shows who unlocked it and the
 * tier (the Achievements page); `context="player"` shows when this player unlocked it.
 */
export function AchievementRow({
  achievement: a,
  context,
  playerCount,
}: {
  achievement: AchievementView;
  context: "group" | "player";
  /** Total players, so the phone summary can say "Everyone". */
  playerCount?: number;
}) {
  const group = context === "group";
  return (
    <li
      className={clsx(
        "relative flex min-h-[68px] flex-none items-center gap-3 border-b border-ivory-line py-2.5 last:border-0 md:min-h-0 md:gap-4",
        group ? "md:flex-wrap md:py-4" : "md:py-3.5",
        a.locked && "max-md:opacity-60",
      )}
    >
      <span className={a.locked ? "rounded-full bg-felt" : undefined}>
        <Badge icon={a.icon} tier={a.tier} locked={a.locked} hidden={a.secret} size="row" />
      </span>

      <span className={clsx("flex min-w-0 flex-1 flex-col gap-0.5", group && "md:min-w-[200px]")}>
        <AchievementDetailTrigger
          id={a.id}
          className={clsx(
            "min-w-0 text-left font-bold before:absolute before:inset-0",
            group ? "text-[14.5px] md:text-lg" : "text-[14.5px] md:text-base",
            !group && a.locked && "text-ink-muted",
          )}
        >
          <span className="block truncate md:whitespace-normal">{a.secret ? "???" : a.name}</span>
        </AchievementDetailTrigger>
        <span className="truncate text-xs text-ink-muted md:text-sm md:whitespace-normal">
          {a.secret ? "Hidden achievement" : a.description}
        </span>

        {group && (
          <>
            {/* Phones: a few stacked dots and one line of names. */}
            <span className="mt-0.5 flex min-w-0 items-center md:hidden">
              {a.winners.length > 0 && (
                <span className="mr-2 flex flex-none">
                  {a.winners.slice(0, 3).map((w) => (
                    <PlayerDot key={w.playerId} color={w.color} size={16} className="-mr-[5px] border-[1.5px] border-ivory ring-0" />
                  ))}
                </span>
              )}
              <span
                className={clsx(
                  "truncate text-[11.5px] font-semibold",
                  a.winners.length > 0 ? "pl-1 text-brass-dark" : "text-ink-muted",
                )}
              >
                {winnersSummary(
                  a.winners.map((w) => w.name),
                  playerCount,
                )}
              </span>
            </span>
            {/* Desktop: every winner, wrapping, each a link. */}
            {a.winners.length > 0 && (
              <span className="mt-1 hidden flex-wrap gap-x-2 gap-y-1 text-sm md:flex">
                {a.winners.map((w) => (
                  <Link
                    key={w.playerId}
                    href={`/players/${w.slug}`}
                    className="relative inline-flex items-center gap-1.5 font-semibold text-brass-dark underline"
                  >
                    <PlayerDot color={w.color} />
                    {w.name}
                  </Link>
                ))}
              </span>
            )}
          </>
        )}

        {a.locked && a.progress && (
          <span className="mt-1 flex items-center gap-2 text-xs font-semibold text-ink-muted">
            <span className="h-1.5 w-28 overflow-hidden rounded-full bg-ivory-line">
              <span
                className="block h-full bg-brass-dark"
                style={{ width: `${Math.min(1, a.progress[0] / a.progress[1]) * 100}%` }}
              />
            </span>
            {a.progress[0]} / {a.progress[1]}
          </span>
        )}
      </span>

      {/* Fixed-width rarity column, wide enough for "ULTRA RARE", so every row lines up. */}
      {group ? (
        <span className="flex w-[72px] flex-none flex-col items-end text-right whitespace-nowrap md:w-[108px]">
          <span className="font-display text-lg leading-[1.1] md:text-2xl md:leading-tight">
            {formatPercent(a.rarity)}
          </span>
          <span
            className={clsx(
              "text-[8.5px] font-bold tracking-[0.1em] uppercase md:text-xs md:tracking-[0.12em] md:text-ink-muted",
              TIER_TEXT[a.tier],
            )}
          >
            {TIER_LABEL[a.tier]}
          </span>
        </span>
      ) : (
        <span className="flex w-[80px] flex-none flex-col items-end gap-0.5 text-right text-sm whitespace-nowrap md:w-[96px]">
          <span className="tabular font-bold">{formatPercent(a.rarity)}</span>
          {a.unlockedDate && a.unlockedSessionId ? (
            <Link href={`/sessions/${a.unlockedSessionId}`} className="relative text-xs text-brass-dark underline">
              {a.unlockedDate}
            </Link>
          ) : (
            <span className="text-xs text-ink-muted">Locked</span>
          )}
        </span>
      )}
    </li>
  );
}
