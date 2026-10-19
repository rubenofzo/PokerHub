import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, Money } from "@/components/ui";
import { getHub } from "@/lib/data";
import { formatDate, formatPercent, playerColors } from "@/lib/format";

export const metadata: Metadata = { title: "Players" };

export default async function PlayersPage() {
  const { stats, achievements } = await getHub();

  if (stats.players.length === 0) {
    return <EmptyState>No players yet. They show up here after their first session.</EmptyState>;
  }

  // Same colours as the balance chart, so a player is recognisable across pages.
  const alphabetical = [...stats.players].sort((a, b) => a.player.name.localeCompare(b.player.name));
  const colors = playerColors(alphabetical.map((p) => p.player.id));
  const totalAchievements = achievements.summaries.length;

  return (
    <main className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-5xl">Players</h1>
        <p className="text-mist">Everyone who has sat at the table, in leaderboard order. Pick one for their full record.</p>
      </div>

      <ul className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5">
        {stats.players.map((p) => {
          const unlocked = (achievements.byPlayer.get(p.player.id) ?? []).filter((a) => a.unlocked).length;
          const last = p.history.at(-1);
          return (
            <li key={p.player.id}>
              <Link
                href={`/players/${p.player.slug}`}
                className="flex h-full flex-col gap-4 rounded-[14px] bg-ivory px-6 pt-5 pb-6 text-ink no-underline shadow-[0_10px_24px_rgba(0,0,0,0.35)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(0,0,0,0.45)]"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span
                      aria-hidden
                      className="h-3 w-3 flex-none rounded-full ring-1 ring-ink/20"
                      style={{ backgroundColor: colors.get(p.player.id) }}
                    />
                    <span className="truncate font-display text-[28px] leading-none">{p.player.name}</span>
                  </span>
                  <span className="flex-none font-display text-xl text-brass-dark">#{p.rank}</span>
                </span>

                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-bold tracking-[0.12em] text-ink-muted uppercase">All-time</span>
                  <Money cents={p.netCents} className="text-2xl" />
                </span>

                <span className="grid grid-cols-3 gap-2 border-t border-ivory-line pt-3 text-center">
                  <Stat label="Sessions" value={p.sessionsPlayed} />
                  <Stat label="Win %" value={formatPercent(p.winRate)} />
                  <Stat label="Badges" value={`${unlocked}/${totalAchievements}`} />
                </span>

                <span className="text-sm text-ink-muted">{last ? `Last played ${formatDate(last.date)}` : "No sessions yet"}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <span className="flex flex-col gap-0.5">
      <span className="tabular text-lg font-bold">{value}</span>
      <span className="text-[11px] font-bold tracking-[0.12em] text-ink-muted uppercase">{label}</span>
    </span>
  );
}
