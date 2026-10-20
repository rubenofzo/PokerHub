import Link from "next/link";
import type { UpcomingSession } from "@/lib/data";
import { formatSessionDate } from "@/lib/schedule";
import { Countdown } from "./Countdown";
import { Chevron, PlayerDot } from "./ui";

const MAX_DOTS = 8;

/**
 * Felt card at the top of home: the next session's countdown, date and time, and who is
 * going. The whole card links to the session page.
 */
export function NextSessionCard({ session, colors }: { session: UpcomingSession; colors: Map<number, string> }) {
  const n = session.going.length;
  return (
    <Link
      href={`/sessions/${session.id}`}
      aria-label={`Next session, ${formatSessionDate(session.date)}`}
      className="group flex flex-col gap-3.5 rounded-2xl border border-brass/60 bg-felt-panel px-3.5 py-4 text-ivory shadow-[0_12px_30px_rgba(0,0,0,0.35)] hover:border-brass md:flex-row md:items-center md:justify-between md:gap-8 md:rounded-[20px] md:px-7 md:py-6"
    >
      <span className="flex min-w-0 flex-col gap-1 md:gap-1.5">
        <span className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold tracking-[0.18em] text-brass uppercase md:text-[13px]">
            Next session
          </span>
          <Chevron className="text-mist group-hover:text-brass md:hidden" />
        </span>
        <span className="font-display text-[26px] leading-tight md:text-[40px]">
          {formatSessionDate(session.date)}
          {session.date && (
            <span className="text-mist"> · {session.startTime ?? "Time TBD"}</span>
          )}
        </span>
        {session.note && <span className="truncate text-[12.5px] text-mist md:text-sm">{session.note}</span>}
        <span className="mt-1 flex items-center gap-2 text-[13px] font-semibold text-mist md:text-[15px]">
          {n > 0 && (
            <span aria-hidden className="flex -space-x-0.5">
              {session.going.slice(0, MAX_DOTS).map((p) => (
                <PlayerDot key={p.id} color={colors.get(p.id)} on="felt" />
              ))}
            </span>
          )}
          {n === 0 ? "Nobody signed up yet" : `${n} ${n === 1 ? "player" : "players"} going`}
        </span>
      </span>
      {session.startsAt ? (
        <Countdown startsAt={session.startsAt} timeKnown={session.startTime !== null} className="md:w-[400px] md:flex-none" />
      ) : (
        <span className="text-[13px] text-mist md:text-[15px]">Countdown starts once the date is set.</span>
      )}
    </Link>
  );
}
