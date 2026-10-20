import Link from "next/link";
import { BalanceChart } from "@/components/BalanceChart";
import { AchievementDetailProvider, AchievementDetailTrigger } from "@/components/AchievementDetail";
import { Badge } from "@/components/Badge";
import { StatsTable } from "@/components/StatsTable";
import { CardPanel, Chevron, EmptyState, FeltPanel, KpiCard, Money, PlayerDot, SectionTitle } from "@/components/ui";
import { TIER_LABEL } from "@/achievements/engine";
import { getHub } from "@/lib/data";
import { formatDate, formatPercent } from "@/lib/format";
import { formatEuro, formatSigned } from "@/lib/money";
import { achievementViews, chartData, playerColorMap, statsRows } from "@/lib/views";

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
  const colors = playerColorMap(stats);
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
    <main className="flex flex-col gap-4 md:gap-8">
      <section
        aria-label="Key numbers"
        className="grid grid-cols-2 gap-2.5 md:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] md:gap-5"
      >
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

      <div className="flex flex-wrap items-stretch gap-4 md:gap-6">
        <FeltPanel className="flex min-w-0 flex-[2_1_560px] flex-col gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <SectionTitle>Balance over time</SectionTitle>
            <span className="text-[11px] text-mist md:text-sm">
              <span className="md:hidden">net in €</span>
              <span className="hidden md:inline">Cumulative net in € · tap a name to show or hide</span>
            </span>
          </div>
          <BalanceChart points={chart.points} series={chart.series} />
        </FeltPanel>

        <CardPanel className="flex min-w-0 flex-[1_1_400px] flex-col pb-1.5 md:gap-2 md:pb-7">
          <div id="leaderboard" className="flex scroll-mt-6 items-baseline justify-between">
            <SectionTitle>Leaderboard</SectionTitle>
            <a href="#all-stats" className="-my-3 py-3 pl-3 text-xs font-semibold text-brass-dark md:my-0 md:py-0 md:pl-0 md:text-sm">
              All stats ↓
            </a>
          </div>
          <div className="hidden grid-cols-[28px_1fr_52px_52px_88px] gap-2 px-1 text-xs font-bold tracking-[0.12em] text-ink-muted uppercase md:grid">
            <span>#</span>
            <span>Player</span>
            <span className="text-right">Sess.</span>
            <span className="text-right">Win%</span>
            <span className="text-right">Net</span>
          </div>
          {/* Phones: rank, dot, name with sessions and win rate underneath, net. Desktop: a table row. */}
          <ol className="mt-2 md:mt-0">
            {stats.players.map((p) => (
              <li key={p.player.id}>
                <Link
                  href={`/players/${p.player.slug}`}
                  className="flex h-12 items-center gap-2.5 border-t border-ivory-line text-[15px] text-ink hover:bg-ivory-line/40 md:grid md:h-auto md:min-h-11 md:grid-cols-[28px_1fr_52px_52px_88px] md:gap-2 md:px-1"
                >
                  <span className="w-[18px] flex-none font-display text-[17px] text-brass-dark md:w-auto md:text-lg">
                    {p.rank}
                  </span>
                  <span className="flex min-w-0 flex-1 items-center gap-2.5">
                    <PlayerDot color={colors.get(p.player.id)} />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-[14.5px] font-semibold md:text-[15px] md:font-bold">{p.player.name}</span>
                      <span className="tabular text-[11px] text-ink-muted md:hidden">
                        {p.sessionsPlayed} {p.sessionsPlayed === 1 ? "session" : "sessions"} · {formatPercent(p.winRate)} won
                      </span>
                    </span>
                  </span>
                  <span className="tabular hidden text-right text-ink-muted md:block">{p.sessionsPlayed}</span>
                  <span className="tabular hidden text-right text-ink-muted md:block">{formatPercent(p.winRate)}</span>
                  <Money cents={p.netCents} className="text-right" />
                </Link>
              </li>
            ))}
          </ol>
        </CardPanel>
      </div>

      <div className="flex flex-wrap gap-6 pt-2 md:pt-0">
        <section className="flex min-w-0 flex-[1_1_420px] flex-col gap-2 md:gap-3.5">
          <SectionTitle className="mb-0.5 md:mb-0">Recent sessions</SectionTitle>
          {recentSessions.map((s) => {
            const top = s.results[0];
            return (
              <Link
                key={s.id}
                href={`/sessions/${s.id}`}
                className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-[3px] rounded-[14px] border border-line bg-felt-panel px-3.5 py-3 text-ivory hover:border-brass md:flex md:flex-wrap md:justify-between md:gap-3 md:px-5 md:py-4"
              >
                <span className="flex flex-col gap-[3px] md:gap-1">
                  <span className="text-[15px] font-semibold md:text-[17px] md:font-bold">{formatDate(s.date)}</span>
                  <span className="text-xs text-mist md:text-sm">
                    {s.results.length} players · {formatEuro(s.potCents)} pot
                    {s.imbalanceCents !== 0 && ` · ${formatEuro(Math.abs(s.imbalanceCents))} spread`}
                  </span>
                </span>
                {top && top.netCents > 0 && (
                  <span className="col-start-1 text-xs font-semibold text-brass md:text-sm md:font-bold">
                    Shark: {playerById.get(top.playerId)?.name} {formatSigned(top.netCents)}
                  </span>
                )}
                <Chevron className="col-start-2 row-span-2 row-start-1 text-mist md:hidden" />
              </Link>
            );
          })}
        </section>

        <section className="flex min-w-0 flex-[1_1_420px] flex-col gap-2.5 md:gap-3.5">
          <div className="flex items-baseline justify-between">
            <SectionTitle>Latest achievements</SectionTitle>
            <Link
              href="/achievements"
              className="-my-3 py-3 pl-3 text-xs font-semibold text-brass md:my-0 md:py-0 md:pl-0 md:text-sm"
            >
              All<span className="hidden md:inline"> achievements</span> →
            </Link>
          </div>
          {/* Phones: a swipeable strip of small cards. Desktop: a grid. Each opens the detail. */}
          <AchievementDetailProvider
            achievements={achievementViews(stats, achievements).filter((v) =>
              latestUnlocks.some((u) => u.achievementId === v.id),
            )}
          >
            <ul className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] md:gap-3 md:overflow-visible md:px-0">
              {latestUnlocks.map((u) => {
                const summary = summaryById.get(u.achievementId)!;
                const player = playerById.get(u.playerId)!;
                return (
                  <li key={`${u.achievementId}-${u.playerId}`} className="flex w-32 flex-none md:w-auto">
                    <AchievementDetailTrigger
                      id={u.achievementId}
                      className="flex w-full flex-col items-start gap-2 rounded-[14px] border border-line bg-felt-panel p-3 text-left hover:border-brass md:flex-row md:items-center md:gap-3 md:p-3.5"
                    >
                      <Badge icon={summary.definition.icon} tier={summary.tier} size="row" />
                      <span className="flex w-full min-w-0 flex-col gap-2 md:gap-0.5">
                        <span className="truncate text-[13.5px] font-semibold md:text-[15px] md:font-bold">
                          {summary.definition.name}
                        </span>
                        <span className="truncate text-[11.5px] text-mist md:text-[13px] md:whitespace-normal">
                          {player.name} · {formatPercent(summary.rarity)}
                          <span className="hidden md:inline"> · {TIER_LABEL[summary.tier]}</span>
                        </span>
                      </span>
                    </AchievementDetailTrigger>
                  </li>
                );
              })}
            </ul>
          </AchievementDetailProvider>
        </section>
      </div>

      <CardPanel className="mt-2 flex flex-col gap-2.5 md:mt-0 md:gap-3">
        <div id="all-stats" className="flex scroll-mt-6 flex-wrap items-baseline justify-between gap-2">
          <SectionTitle>All stats</SectionTitle>
          <span className="text-[11px] text-ink-muted md:text-sm">
            <span className="md:hidden">Swipe for more · tap to sort</span>
            <span className="hidden md:inline">Click a column to sort</span>
          </span>
        </div>
        <StatsTable rows={statsRows(stats)} />
      </CardPanel>
    </main>
  );
}
