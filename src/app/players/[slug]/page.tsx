import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AchievementShowcase, type ShowcaseItem } from "@/components/AchievementShowcase";
import { BalanceChart } from "@/components/BalanceChart";
import { CardPanel, FeltPanel, KpiCard, Money, SectionTitle } from "@/components/ui";
import { getHub } from "@/lib/data";
import { formatDate, formatPercent } from "@/lib/format";
import { formatEuro, formatSigned } from "@/lib/money";
import { chartData } from "@/lib/views";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { allPlayers } = await getHub();
  return { title: allPlayers.find((p) => p.slug === slug)?.name ?? "Player" };
}

export default async function PlayerPage({ params }: Props) {
  const { slug } = await params;
  const { stats, achievements } = await getHub();
  const me = stats.players.find((p) => p.player.slug === slug);
  if (!me) notFound();

  const chart = chartData(stats, [me]);
  const sessionOrder = new Map(stats.sessions.map((s, i) => [s.id, i]));
  const items: ShowcaseItem[] = (achievements.byPlayer.get(me.player.id) ?? []).map((a) => ({
    id: a.definition.id,
    name: a.definition.name,
    description: a.definition.description,
    icon: a.definition.icon,
    hidden: !!a.definition.hidden,
    tier: a.tier,
    rarity: a.rarity,
    unlockedOrder: a.unlocked ? (sessionOrder.get(a.unlocked.sessionId) ?? null) : null,
    unlockedDate: a.unlocked ? formatDate(a.unlocked.date) : null,
    unlockedSessionId: a.unlocked?.sessionId ?? null,
    progress: a.progress,
  }));

  const tiles: [string, React.ReactNode][] = [
    ["ROI", me.roi === null ? "–" : `${me.roi.toFixed(2)}×`],
    ["Biggest win", me.biggestWin ? formatSigned(me.biggestWin.netCents) : "–"],
    ["Biggest loss", me.biggestLoss ? formatSigned(me.biggestLoss.netCents) : "–"],
    ["Longest win run", me.bestWinStreak],
    ["Longest loss run", me.worstLossStreak],
    ["Rebuys", me.rebuys],
    ["Swing", formatEuro(me.swingCents)],
    ["Attendance", formatPercent(me.attendance)],
  ];

  return (
    <main className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link href="/players" className="text-sm font-semibold text-brass">
            ← All players
          </Link>
          <h1 className="font-display text-5xl">{me.player.name}</h1>
          <span className="text-mist">
            Rank {me.rank} of {stats.players.length}
          </span>
        </div>
      </div>

      <section aria-label="Key numbers" className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-5">
        <KpiCard suit="♠" label="All-time" value={formatSigned(me.netCents)} sub={`Rank ${me.rank}`} />
        <KpiCard suit="♦" label="Sessions" value={me.sessionsPlayed} sub={`${formatEuro(me.totalInCents)} bought in`} />
        <KpiCard suit="♣" label="Win rate" value={formatPercent(me.winRate)} sub="Sessions in profit" />
        <KpiCard suit="♥" label="Per session" value={formatSigned(me.averageCents)} sub="Average result" />
      </section>

      <dl className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
        {tiles.map(([label, value]) => (
          <div key={label} className="rounded-[14px] border border-line bg-felt-panel px-4 py-3">
            <dt className="text-xs font-bold tracking-[0.12em] text-mist uppercase">{label}</dt>
            <dd className="tabular mt-1 text-xl font-bold">{value}</dd>
          </div>
        ))}
      </dl>

      <AchievementShowcase items={items} playerName={me.player.name} />

      <div className="flex flex-wrap gap-6">
        <FeltPanel className="flex min-w-0 flex-[2_1_520px] flex-col gap-4">
          <SectionTitle>Balance over time</SectionTitle>
          <BalanceChart points={chart.points} series={chart.series} showLegend={false} height={280} />
        </FeltPanel>

        <CardPanel className="flex min-w-0 flex-[1_1_420px] flex-col gap-2">
          <SectionTitle>Sessions</SectionTitle>
          <div className="overflow-x-auto">
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
