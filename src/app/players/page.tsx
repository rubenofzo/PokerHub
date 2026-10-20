import type { Metadata } from "next";
import Link from "next/link";
import { CardPanel, Chevron, EmptyState, Money, PageTitle, PlayerDot } from "@/components/ui";
import { getHub } from "@/lib/data";
import { formatDate, formatPercent } from "@/lib/format";
import { playerColorMap } from "@/lib/views";

export const metadata: Metadata = { title: "Players" };

export default async function PlayersPage() {
  const { stats, achievements } = await getHub();

  if (stats.players.length === 0) {
    return <EmptyState>No players yet. They show up here after their first session.</EmptyState>;
  }

  // Same colours as the balance chart, so a player is recognisable across pages.
  const colors = playerColorMap(stats);
  const totalAchievements = achievements.summaries.length;
  const badges = (playerId: number) => (achievements.byPlayer.get(playerId) ?? []).filter((a) => a.unlocked).length;

  return (
    <main className="flex flex-col gap-3.5 md:gap-6">
      <div className="flex flex-col gap-1.5 md:gap-1">
        <PageTitle>Players</PageTitle>
        <p className="text-[12.5px] text-mist md:text-base">
          <span className="md:hidden">In leaderboard order. Tap one for their full record.</span>
          <span className="hidden md:inline">
            Everyone who has sat at the table, in leaderboard order. Pick one for their full record.
          </span>
        </p>
      </div>

      {/* Phones: one ivory list. Desktop: a grid of cards. */}
      <CardPanel list className="md:hidden">
        <ul>
          {stats.players.map((p) => (
            <li key={p.player.id} className="border-t border-ivory-line first:border-0">
              <Link href={`/players/${p.player.slug}`} className="flex h-[70px] items-center gap-3 text-ink">
                <span className="tabular w-5 flex-none font-display text-[17px] text-brass-dark">{p.rank}</span>
                <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                  <span className="flex min-w-0 items-center gap-2">
                    <PlayerDot color={colors.get(p.player.id)} />
                    <span className="truncate font-display text-[19px] leading-none">{p.player.name}</span>
                  </span>
                  <span className="tabular truncate text-[11.5px] text-ink-muted">
                    {p.sessionsPlayed} {p.sessionsPlayed === 1 ? "session" : "sessions"} · {formatPercent(p.winRate)} won ·{" "}
                    {badges(p.player.id)}/{totalAchievements} badges
                  </span>
                </span>
                <Money cents={p.netCents} className="text-base" />
                <Chevron className="text-ink-muted/70" />
              </Link>
            </li>
          ))}
        </ul>
      </CardPanel>

      <ul className="hidden grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5 md:grid">
        {stats.players.map((p) => {
          const unlocked = badges(p.player.id);
          const last = p.history.at(-1);
          return (
            <li key={p.player.id}>
              <Link
                href={`/players/${p.player.slug}`}
                className="flex h-full flex-col gap-4 rounded-[14px] bg-ivory px-6 pt-5 pb-6 text-ink no-underline shadow-[0_10px_24px_rgba(0,0,0,0.35)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(0,0,0,0.45)]"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <PlayerDot color={colors.get(p.player.id)} size={12} />
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
