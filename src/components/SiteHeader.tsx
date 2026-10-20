import clsx from "clsx";
import Link from "next/link";
import { getHub } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { formatSessionDate } from "@/lib/schedule";

/**
 * Phones: a slim row with the logo and a round new-session button, the meta line underneath
 * (page navigation lives in `BottomNav`). Desktop: logo and meta on the left, nav on the right.
 */
export async function SiteHeader() {
  const { stats, nextSession } = await getHub();
  const last = stats.sessions.at(-1);
  const parts = [
    `${stats.sessions.length} ${stats.sessions.length === 1 ? "session" : "sessions"}`,
    `${stats.players.length} ${stats.players.length === 1 ? "player" : "players"}`,
    last ? `last game ${formatDate(last.date)}` : "no games yet",
  ];

  return (
    <header className="grid grid-cols-[1fr_auto] items-center gap-x-4 md:flex md:flex-wrap md:items-end md:justify-between md:gap-4 md:border-b md:border-line md:pb-6">
      {/* `contents` on phones so the meta line can sit under the new-session button too. */}
      <div className="contents md:flex md:flex-col md:gap-1.5">
        <span className="col-start-1 text-[9px] font-semibold tracking-[0.14em] text-brass uppercase md:text-[13px] md:tracking-[0.24em]">
          The card room
        </span>
        <Link
          href="/"
          className="col-start-1 mt-0.5 font-display text-[28px] leading-none text-ivory no-underline md:mt-0 md:text-[56px]"
        >
          PokerHub
        </Link>
        <span className="col-span-2 mt-1.5 text-[12.5px] text-mist md:mt-0 md:text-[15px]">
          {parts.join(" · ")}
          {/* Desktop only: phones see the next session on home, and the line stays one row. */}
          {nextSession && (
            <span className="hidden md:inline">
              {" "}· next game {nextSession.date ? formatSessionDate(nextSession.date) : "TBD"}
            </span>
          )}
        </span>
      </div>
      <nav className="col-start-2 row-span-2 row-start-1 flex items-center gap-1 md:flex-wrap md:gap-3">
        <Link href="/#leaderboard" className="hidden px-3 py-3 text-[15px] font-semibold text-brass hover:text-ivory md:inline">
          Leaderboard
        </Link>
        <Link href="/players" className="hidden px-3 py-3 text-[15px] font-semibold text-brass hover:text-ivory md:inline">
          Players
        </Link>
        <Link href="/achievements" className="hidden px-3 py-3 text-[15px] font-semibold text-brass hover:text-ivory md:inline">
          Achievements
        </Link>
        {/* While a session is planned, desktop's highlighted button goes to it and "New
            session" becomes a plain link; phones keep the round plus (the next session is a
            tab in `BottomNav`). */}
        {nextSession && (
          <Link href="/admin" className="hidden px-3 py-3 text-[15px] font-semibold text-brass hover:text-ivory md:inline">
            New session
          </Link>
        )}
        <Link
          href="/admin"
          className={clsx(
            "inline-flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-brass text-[15px] font-bold text-brass hover:bg-brass hover:text-felt md:h-auto md:min-h-11 md:w-auto md:border-2 md:px-5",
            nextSession && "md:hidden",
          )}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="md:hidden">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          <span className="sr-only md:not-sr-only">New session</span>
        </Link>
        {nextSession && (
          <Link
            href={`/sessions/${nextSession.id}`}
            className="hidden min-h-11 items-center rounded-full border-2 border-brass px-5 text-[15px] font-bold text-brass hover:bg-brass hover:text-felt md:inline-flex"
          >
            Next session
          </Link>
        )}
      </nav>
    </header>
  );
}
