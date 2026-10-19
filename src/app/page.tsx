import Link from "next/link";
import { BalanceChart } from "@/components/BalanceChart";
import { Badge } from "@/components/Badge";
import { StatsTable } from "@/components/StatsTable";
import { CardPanel, EmptyState, FeltPanel, KpiCard, Money, SectionTitle } from "@/components/ui";
import { TIER_LABEL } from "@/achievements/engine";
import { getHub } from "@/lib/data";
import { formatDate, formatPercent } from "@/lib/format";
import { formatEuro, formatSigned } from "@/lib/money";
import { chartData, statsRows } from "@/lib/views";

export default async function Dashboard() {
  const { stats, achievements, playerById } = await getHub();

  if (stats.sessions.length === 0) {
    return (
      <EmptyState>
        No sessions yet.{" "}
        <Link href="/admin" className="font-bold text-brass underline">
          Upload the first one
        </Link>{" "}
        to deal everyone in.
      </EmptyState>
    );
  }

  const leader = stats.players[0];
  const allResults = stats.sessions.flatMap((s) => s.results.map((r) => ({ ...r, session: s })));
  const worst = allResults.reduce((w, r) => (r.netCents < w.netCents ? r : w));
  const totalIn = stats.sessions.reduce((s, x) => s + x.potCents, 0);
  const chart = chartData(stats);
  const recentSessions = [...stats.sessions].reverse().slice(0, 5);
  const summaryById = new Map(achievements.summaries.map((s) => [s.definition.id, s]));
  // Newest session first, and within a session the rarest unlocks first.
  const sessionOrder = new Map(stats.sessions.map((s, i) => [s.id, i]));
  const latestUnlocks = [...achievements.recent]
    .sort(
      (a, b) =>
        (sessionOrder.get(b.sessionId) ?? 0) - (sessionOrder.get(a.sessionId) ?? 0) ||
        (summaryById.get(a.achievementId)?.rarity ?? 0) - (summaryById.get(b.achievementId)?.rarity ?? 0),
    )
    .slice(0, 6);

  return (
    <main className="flex flex-col gap-8">
      <section aria-label="Key numbers" className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5">
        <KpiCard
          suit="♠"
          label="Sessions"
          value={stats.sessions.length}
          sub={`${stats.players.length} different players`}
        />
        <KpiCard suit="♦" label="Money on the table" value={formatEuro(totalIn)} sub="Total bought in" />
        <KpiCard
          suit="♣"
          label="Chip leader"
          value={
            <Link href={`/players/${leader.player.slug}`} className="hover:text-brass-dark hover:underline">
              {leader.player.name}
            </Link>
          }
          sub={`${formatSigned(leader.netCents)} all-time`}
        />
        <KpiCard
          suit="♥"
          label="Worst night"
          value={formatSigned(worst.netCents)}
          sub={`${playerById.get(worst.playerId)?.name}, ${formatDate(worst.session.date)}`}
        />
      </section>

      <div className="flex flex-wrap items-stretch gap-6">
        <FeltPanel className="flex min-w-0 flex-[2_1_560px] flex-col gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <SectionTitle>Balance over time</SectionTitle>
            <span className="text-sm text-mist">Cumulative net in € · tap a name to show or hide</span>
          </div>
          <BalanceChart points={chart.points} series={chart.series} />
        </FeltPanel>

        <CardPanel className="flex min-w-0 flex-[1_1_400px] flex-col gap-2">
          <div id="leaderboard" className="flex scroll-mt-6 items-baseline justify-between">
            <SectionTitle>Leaderboard</SectionTitle>
            <a href="#all-stats" className="text-sm font-semibold text-brass-dark">
              All stats ↓
            </a>
          </div>
          <div className="grid grid-cols-[28px_1fr_52px_52px_88px] gap-2 px-1 text-xs font-bold tracking-[0.12em] text-ink-muted uppercase">
            <span>#</span>
            <span>Player</span>
            <span className="text-right">Sess.</span>
            <span className="text-right">Win%</span>
            <span className="text-right">Net</span>
          </div>
          <ol>
            {stats.players.map((p) => (
              <li key={p.player.id}>
                <Link
                  href={`/players/${p.player.slug}`}
                  className="grid min-h-11 grid-cols-[28px_1fr_52px_52px_88px] items-center gap-2 border-t border-ivory-line px-1 text-[15px] text-ink hover:bg-ivory-line/40"
                >
                  <span className="font-display text-lg text-brass-dark">{p.rank}</span>
                  <span className="truncate font-bold">{p.player.name}</span>
                  <span className="tabular text-right text-ink-muted">{p.sessionsPlayed}</span>
                  <span className="tabular text-right text-ink-muted">{formatPercent(p.winRate)}</span>
                  <Money cents={p.netCents} className="text-right" />
                </Link>
              </li>
            ))}
          </ol>
        </CardPanel>
      </div>

      <div className="flex flex-wrap gap-6">
        <section className="flex min-w-0 flex-[1_1_420px] flex-col gap-3.5">
          <SectionTitle>Recent sessions</SectionTitle>
          {recentSessions.map((s) => {
            const top = s.results[0];
            return (
              <Link
                key={s.id}
                href={`/sessions/${s.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-line bg-felt-panel px-5 py-4 text-ivory hover:border-brass"
              >
                <span className="flex flex-col gap-1">
                  <span className="text-[17px] font-bold">{formatDate(s.date)}</span>
                  <span className="text-sm text-mist">
                    {s.results.length} players · {formatEuro(s.potCents)} pot
                    {s.imbalanceCents !== 0 && ` · ${formatEuro(Math.abs(s.imbalanceCents))} spread`}
                  </span>
                </span>
                {top && top.netCents > 0 && (
                  <span className="text-sm font-bold text-brass">
                    Shark: {playerById.get(top.playerId)?.name} {formatSigned(top.netCents)}
                  </span>
                )}
              </Link>
            );
          })}
        </section>

        <section className="flex min-w-0 flex-[1_1_420px] flex-col gap-3.5">
          <div className="flex items-baseline justify-between">
            <SectionTitle>Latest achievements</SectionTitle>
            <Link href="/achievements" className="text-sm font-semibold text-brass">
              All achievements →
            </Link>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
            {latestUnlocks.map((u) => {
              const summary = summaryById.get(u.achievementId)!;
              const player = playerById.get(u.playerId)!;
              return (
                <Link
                  key={`${u.achievementId}-${u.playerId}`}
                  href={`/players/${player.slug}`}
                  className="flex items-center gap-3 rounded-[14px] border border-line bg-felt-panel p-3.5 hover:border-brass"
                >
                  <Badge icon={summary.definition.icon} tier={summary.tier} />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-[15px] font-bold">{summary.definition.name}</span>
                    <span className="text-[13px] text-mist">
                      {player.name} · {formatPercent(summary.rarity)} · {TIER_LABEL[summary.tier]}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      <CardPanel className="flex flex-col gap-3">
        <div id="all-stats" className="flex scroll-mt-6 flex-wrap items-baseline justify-between gap-2">
          <SectionTitle>All stats</SectionTitle>
          <span className="text-sm text-ink-muted">Click a column to sort</span>
        </div>
        <StatsTable rows={statsRows(stats)} />
      </CardPanel>
    </main>
  );
}
