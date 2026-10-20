import Link from "next/link";
import type { UpcomingSession } from "@/lib/data";
import { formatSchedule } from "@/lib/schedule";
import { CardPanel, Chevron, PageTitle, PlayerDot, SectionTitle } from "./ui";

/** Player page for someone who signed up but has no results yet: name and the games they're going to. */
export function NoGamesYet({ name, sessions }: { name: string; sessions: UpcomingSession[] }) {
  return (
    <main className="flex flex-col gap-4 md:gap-8">
      <div className="-mt-1.5 flex flex-col gap-1 md:mt-0">
        <Link href="/players" className="inline-flex min-h-11 items-center self-start text-[13px] font-semibold text-brass md:min-h-0 md:text-sm">
          ← All players
        </Link>
        <div className="flex items-center gap-2.5 md:gap-3">
          <PlayerDot size={12} on="felt" />
          <PageTitle className="min-w-0 truncate">{name}</PageTitle>
        </div>
        <p className="text-[12.5px] text-mist md:text-base">
          No games yet. Stats and achievements start after the first session.
        </p>
      </div>

      <CardPanel className="flex flex-col gap-1.5 pb-1.5 md:max-w-2xl md:gap-2 md:pb-7">
        <SectionTitle>Going to</SectionTitle>
        <ul>
          {sessions.map((s) => (
            <li key={s.id}>
              <Link
                href={`/sessions/${s.id}`}
                className="flex min-h-[58px] items-center gap-2.5 border-t border-ivory-line text-ink hover:text-brass-dark"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[14.5px] font-semibold md:text-[15px] md:font-bold">{formatSchedule(s.date, s.startTime)}</span>
                  <span className="truncate text-[11.5px] text-ink-muted md:text-sm">
                    {s.going.length} going{s.note ? ` · ${s.note}` : ""}
                  </span>
                </span>
                <Chevron className="text-ink-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </CardPanel>
    </main>
  );
}
