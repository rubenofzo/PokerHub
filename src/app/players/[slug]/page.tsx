import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AchievementShowcase } from "@/components/AchievementShowcase";
import { BalanceChart } from "@/components/BalanceChart";
import { CardPanel, FeltPanel, KpiCard, Money, PageTitle, PlayerDot, SectionTitle } from "@/components/ui";
import { NoGamesYet } from "@/components/NoGamesYet";
import { getHub } from "@/lib/data";
import { formatDate, formatPercent } from "@/lib/format";
import { formatEuro, formatSigned } from "@/lib/money";
import { chartData, playerAchievementViews, playerColorMap } from "@/lib/views";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { allPlayers } = await getHub();
  return { title: allPlayers.find((p) => p.slug === slug)?.name ?? "Player" };
}

export default async function PlayerPage({ params }: Props) {
  const { slug } = await params;
  const { stats, achievements, allPlayers, upcoming } = await getHub();
  const me = stats.players.find((p) => p.player.slug === slug);
  if (!me) {
    // Signed up but never played: a page with their upcoming games and no stats.
    const player = allPlayers.find((p) => p.slug === slug);
    const going = player ? upcoming.filter((s) => s.going.some((g) => g.id === player.id)) : [];
    if (!player || going.length === 0) notFound();
    return <NoGamesYet name={player.name} sessions={going} />;
  }

  const chart = chartData(stats, [me]);
  const color = playerColorMap(stats).get(me.player.id);
  const items = playerAchievementViews(stats, achievements, me.player.id);

  // Win and loss are tinted on phones only; desktop keeps them ivory.
  const signedTile = (cents: number) => <Money cents={cents} on="felt" className="md:text-ivory" />;
  const tiles: [string, React.ReactNode][] = [
    ["ROI", me.roi === null ? "–" : `${me.roi.toFixed(2)}×`],
    ["Biggest win", me.biggestWin ? signedTile(me.biggestWin.netCents) : "–"],
    ["Biggest loss", me.biggestLoss ? signedTile(me.biggestLoss.netCents) : "–"],
    ["Longest win run", me.bestWinStreak],
    ["Longest loss run", me.worstLossStreak],
    ["Rebuys", me.rebuys],
    ["Swing", formatEuro(me.swingCents)],
    ["Attendance", formatPercent(me.attendance)],
  ];

  return (
    <main className="flex flex-col gap-4 md:gap-8">
      <div className="-mt-1.5 -mb-4 flex flex-wrap items-end justify-between gap-4 md:my-0">
        <div className="flex flex-col gap-1">
          <Link href="/players" className="inline-flex min-h-11 items-center text-[13px] font-semibold text-brass md:min-h-0 md:text-sm">
            ← All players
          </Link>
          <PageTitle className="hidden md:block">{me.player.name}</PageTitle>
          <span className="hidden text-mist md:inline">
            Rank {me.rank} of {stats.players.length}
          </span>
        </div>
      </div>

      {/* Phones: one hero card instead of four KPI cards. */}
      <CardPanel className="md:hidden">
        <div className="flex items-center gap-2.5">
          <PlayerDot color={color} size={12} />
          <PageTitle className="min-w-0 flex-1 truncate leading-none">{me.player.name}</PageTitle>
          <span className="tabular flex-none font-display text-lg text-brass-dark">
            #{me.rank} <span className="font-sans text-xs text-ink-muted">of {stats.players.length}</span>
          </span>
        </div>
        <div className="mt-3.5 flex items-baseline justify-between gap-2">
          <span className="text-[10px] font-bold tracking-[0.14em] text-ink-muted uppercase">All-time</span>
          <Money cents={me.netCents} display className="text-[34px] leading-none" />
        </div>
        <dl className="mt-3.5 grid grid-cols-3 border-t border-ivory-line pt-3 text-center">
          {(
            [
              ["Sessions", me.sessionsPlayed],
              ["Win rate", formatPercent(me.winRate)],
              ["Per session", <Money key="avg" cents={me.averageCents} />],
            ] as [string, React.ReactNode][]
          ).map(([label, value]) => (
            <div key={label} className="flex flex-col-reverse gap-0.5">
              <dt className="text-[9px] font-bold tracking-[0.14em] text-ink-muted uppercase">{label}</dt>
              <dd className="tabular text-[17px] font-bold">{value}</dd>
            </div>
          ))}
        </dl>
      </CardPanel>

      <section aria-label="Key numbers" className="hidden grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-5 md:grid">
        <KpiCard suit="♠" label="All-time" value={formatSigned(me.netCents)} sub={`Rank ${me.rank}`} />
        <KpiCard suit="♦" label="Sessions" value={me.sessionsPlayed} sub={`${formatEuro(me.totalInCents)} bought in`} />
        <KpiCard suit="♣" label="Win rate" value={formatPercent(me.winRate)} sub="Sessions in profit" />
        <KpiCard suit="♥" label="Per session" value={formatSigned(me.averageCents)} sub="Average result" />
      </section>

      <dl className="-mt-1.5 grid grid-cols-2 gap-2 md:mt-0 md:grid-cols-[repeat(auto-fit,minmax(140px,1fr))] md:gap-3">
        {tiles.map(([label, value]) => (
          <div
            key={label}
            className="flex h-[46px] items-center justify-between gap-2 rounded-xl border border-line bg-felt-panel px-3 md:block md:h-auto md:rounded-[14px] md:px-4 md:py-3"
          >
            <dt className="truncate text-[11.5px] text-mist md:overflow-visible md:text-xs md:whitespace-normal md:font-bold md:tracking-[0.12em] md:uppercase">{label}</dt>
            <dd className="tabular text-sm font-bold md:mt-1 md:text-xl">{value}</dd>
          </div>
        ))}
      </dl>

      <AchievementShowcase items={items} playerName={me.player.name} />

      <div className="flex flex-wrap gap-4 md:gap-6">
        <FeltPanel className="flex min-w-0 flex-[2_1_520px] flex-col gap-2.5 md:gap-4">
          <SectionTitle>Balance over time</SectionTitle>
          <BalanceChart points={chart.points} series={chart.series} showLegend={false} height={280} />
        </FeltPanel>

        <CardPanel className="flex min-w-0 flex-[1_1_420px] flex-col gap-1.5 pb-1 md:gap-2 md:pb-7">
          <SectionTitle>Sessions</SectionTitle>
          {/* Phones: list rows. Desktop: a table. */}
          <ul className="md:hidden">
            {[...me.history].reverse().map((h) => (
              <li key={h.sessionId}>
                <Link
                  href={`/sessions/${h.sessionId}`}
                  className="flex h-[58px] items-center gap-2.5 border-t border-ivory-line text-ink"
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-[14.5px] font-semibold">{formatDate(h.date)}</span>
                    <span className="tabular truncate text-[11.5px] text-ink-muted">
                      In {formatEuro(h.moneyInCents)} · out {formatEuro(h.moneyOutCents)} · {h.buyIns}{" "}
                      {h.buyIns === 1 ? "buy-in" : "buy-ins"}
                    </span>
                  </span>
                  <Money cents={h.netCents} className="text-[15px]" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[340px] text-[15px]">
              <thead>
                <tr className="text-xs font-bold tracking-[0.12em] text-ink-muted uppercase">
                  <th scope="col" className="py-2 text-left">Date</th>
                  <th scope="col" className="py-2 text-right">In</th>
                  <th scope="col" className="py-2 text-right">Out</th>
                  <th scope="col" className="py-2 text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {[...me.history].reverse().map((h) => (
                  <tr key={h.sessionId} className="border-t border-ivory-line">
                    <td className="py-2.5">
                      <Link href={`/sessions/${h.sessionId}`} className="font-bold text-ink hover:text-brass-dark">
                        {formatDate(h.date)}
                      </Link>
                    </td>
                    <td className="tabular py-2.5 text-right text-ink-muted">{formatEuro(h.moneyInCents)}</td>
                    <td className="tabular py-2.5 text-right text-ink-muted">{formatEuro(h.moneyOutCents)}</td>
                    <td className="py-2.5 text-right">
                      <Money cents={h.netCents} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardPanel>
      </div>
    </main>
  );
}
