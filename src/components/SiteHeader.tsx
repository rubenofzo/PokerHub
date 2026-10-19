import Link from "next/link";
import { getHub } from "@/lib/data";
import { formatDate } from "@/lib/format";

export async function SiteHeader() {
  const { stats } = await getHub();
  const last = stats.sessions.at(-1);
  const parts = [
    `${stats.sessions.length} ${stats.sessions.length === 1 ? "session" : "sessions"}`,
    `${stats.players.length} ${stats.players.length === 1 ? "player" : "players"}`,
    last ? `last game ${formatDate(last.date)}` : "no games yet",
  ];

  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold tracking-[0.24em] text-brass uppercase">The card room</span>
        <Link href="/" className="font-display text-5xl leading-none text-ivory no-underline sm:text-[56px]">
          PokerHub
        </Link>
        <span className="text-[15px] text-mist">{parts.join(" · ")}</span>
      </div>
      <nav className="flex flex-wrap items-center gap-1 sm:gap-3">
        <Link href="/#leaderboard" className="px-3 py-3 text-[15px] font-semibold text-brass hover:text-ivory">
          Leaderboard
        </Link>
        <Link href="/achievements" className="px-3 py-3 text-[15px] font-semibold text-brass hover:text-ivory">
          Achievements
        </Link>
        <Link
          href="/admin"
          className="inline-flex min-h-11 items-center rounded-full border-2 border-brass px-5 text-[15px] font-bold text-brass hover:bg-brass hover:text-felt"
        >
          Upload session
        </Link>
      </nav>
    </header>
  );
}
