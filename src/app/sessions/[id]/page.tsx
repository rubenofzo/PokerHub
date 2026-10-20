import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AchievementDetailProvider, AchievementDetailTrigger } from "@/components/AchievementDetail";
import { Badge } from "@/components/Badge";
import { UpcomingSession } from "@/components/UpcomingSession";
import { CardPanel, FeltPanel, KpiCard, Money, PageTitle, PlayerDot, SectionTitle } from "@/components/ui";
import { TIER_LABEL } from "@/achievements/engine";
import { isAdmin } from "@/lib/auth";
import { getHub } from "@/lib/data";
import { formatDate, formatPercent } from "@/lib/format";
import { formatEuro, formatSigned } from "@/lib/money";
import { formatSessionDate } from "@/lib/schedule";
import { achievementViews, playerColorMap } from "@/lib/views";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { stats, upcoming } = await getHub();
  const session = stats.sessions.find((s) => s.id === Number(id));
  if (session) return { title: `Session ${formatDate(session.date)}` };
  const next = upcoming.find((s) => s.id === Number(id));
  return { title: next ? `Next session ${formatSessionDate(next.date)}` : "Session" };
}

export default async function SessionPage({ params }: Props) {
  const { id } = await params;
  const hub = await getHub();
  const { stats, achievements, playerById } = hub;
  const admin = await isAdmin();
  const upcoming = hub.upcoming.find((s) => s.id === Number(id));
  if (upcoming) return <UpcomingSession session={upcoming} hub={hub} admin={admin} />;
  const session = stats.sessions.find((s) => s.id === Number(id));
  if (!session) notFound();

  const summaryById = new Map(achievements.summaries.map((s) => [s.definition.id, s]));
  const unlocks = achievements.recent
    .filter((u) => u.sessionId === session.id)
    .sort((a, b) => (summaryById.get(a.achievementId)?.rarity ?? 0) - (summaryById.get(b.achievementId)?.rarity ?? 0));
  const top = session.results[0];
  const bottom = session.results.at(-1)!;
  const hasCorrection = session.imbalanceCents !== 0;
  const colors = playerColorMap(stats);
  // Phones group the unlocks by achievement: one row each, with everyone who got it.
  const unlockGroups = [...new Set(unlocks.map((u) => u.achievementId))].map((id) => ({
    summary: summaryById.get(id)!,
    names: unlocks.filter((u) => u.achievementId === id).map((u) => playerById.get(u.playerId)?.name ?? "?"),
  }));

  return (
    <main className="flex flex-col gap-4 md:gap-8">
      <div className="-mt-1.5 flex flex-wrap items-end justify-between gap-4 md:mt-0">
        <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto] items-baseline gap-x-3 md:flex md:flex-none md:flex-col md:gap-1">
          <Link
            href="/"
            className="col-span-2 inline-flex min-h-11 items-center text-[13px] font-semibold text-brass md:min-h-0 md:text-sm"
          >
            ← Dashboard
          </Link>
          <PageTitle>{formatDate(session.date)}</PageTitle>
          <span className="text-right text-[12.5px] text-mist md:text-left md:text-base">
            Session {session.number} of {stats.sessions.length}
            {session.note ? ` · ${session.note}` : ""}
          </span>
        </div>
        {admin && (
          <Link
            href={`/admin/sessions/${session.id}`}
            className="inline-flex min-h-11 items-center rounded-full border-2 border-brass px-5 font-bold text-brass hover:bg-brass hover:text-felt"
          >
            Edit session
          </Link>
        )}
      </div>

      {/* Phones: the four numbers share one ivory card. */}
      <section
        aria-label="Key numbers"
        className="grid grid-cols-2 overflow-hidden rounded-2xl bg-ivory shadow-[0_12px_30px_rgba(0,0,0,0.35)] md:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] md:gap-5 md:overflow-visible md:rounded-none md:bg-transparent md:shadow-none"
      >
        <KpiCard grouped suit="♠" label="Players" value={session.results.length} />
        <KpiCard grouped suit="♦" label="Pot" value={formatEuro(session.potCents)} sub="Total bought in" />
        <KpiCard
          grouped
          suit="♣"
          label="Shark"
          value={playerById.get(top.playerId)?.name}
          sub={formatSigned(top.netCents)}
        />
        <KpiCard
          grouped
          suit="♥"
          label="Donor"
          value={playerById.get(bottom.playerId)?.name}
          sub={formatSigned(bottom.netCents)}
        />
      </section>

      <CardPanel className="flex flex-col gap-2 pb-1.5 md:gap-3 md:pb-7">
        <SectionTitle>Results</SectionTitle>
        {hasCorrection && (
          <p className="rounded-[10px] bg-ivory-line/60 px-2.5 py-2 text-xs leading-[1.45] text-ink-muted md:rounded-xl md:px-4 md:py-3 md:text-sm md:leading-5">
            The sheet was {formatEuro(Math.abs(session.imbalanceCents))}{" "}
            {session.imbalanceCents > 0 ? "short (more went in than came out)" : "over (more came out than went in)"}.
            That difference is split evenly over everyone at the table, shown under Spread.
          </p>
        )}
        {/* Phones: list rows. Desktop: a table. */}
        <ul className="md:hidden">
          {session.results.map((r) => {
            const player = playerById.get(r.playerId)!;
            return (
              <li key={r.playerId}>
                <Link
                  href={`/players/${player.slug}`}
                  className="flex h-[58px] items-center gap-2.5 border-t border-ivory-line text-ink"
                >
                  <PlayerDot color={colors.get(r.playerId)} />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-[14.5px] font-semibold">{player.name}</span>
                    <span className="tabular truncate text-[11.5px] text-ink-muted">
                      {formatEuro(r.moneyInCents)} in → {formatEuro(r.moneyOutCents)} out · {r.buyIns}{" "}
                      {r.buyIns === 1 ? "buy-in" : "buy-ins"}
                      {r.buyInsInferred && "*"}
                    </span>
                  </span>
                  <span className="flex flex-none flex-col items-end gap-px">
                    <Money cents={r.netCents} className="text-[15px]" />
                    {hasCorrection && (
                      <span className="tabular text-[10.5px] text-ink-muted">{formatSigned(r.correctionCents)} spread</span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[560px] text-[15px]">
            <thead>
              <tr className="text-xs font-bold tracking-[0.12em] text-ink-muted uppercase">
                <th scope="col" className="py-2 text-left">Player</th>
                <th scope="col" className="py-2 text-right">Buy-ins</th>
                <th scope="col" className="py-2 text-right">In</th>
                <th scope="col" className="py-2 text-right">Out</th>
                {hasCorrection && <th scope="col" className="py-2 text-right">Spread</th>}
                <th scope="col" className="py-2 text-right">Net</th>
              </tr>
            </thead>
            <tbody>
              {session.results.map((r) => {
                const player = playerById.get(r.playerId)!;
                return (
                  <tr key={r.playerId} className="border-t border-ivory-line">
                    <th scope="row" className="py-2.5 text-left">
                      <Link href={`/players/${player.slug}`} className="font-bold text-ink hover:text-brass-dark">
                        {player.name}
                      </Link>
                    </th>
                    <td className="tabular py-2.5 text-right text-ink-muted">
                      {r.buyIns}
                      {r.buyInsInferred && <span title="Estimated from money in ÷ €5">*</span>}
                    </td>
                    <td className="tabular py-2.5 text-right text-ink-muted">{formatEuro(r.moneyInCents)}</td>
                    <td className="tabular py-2.5 text-right text-ink-muted">{formatEuro(r.moneyOutCents)}</td>
                    {hasCorrection && (
                      <td className="tabular py-2.5 text-right text-ink-muted">{formatSigned(r.correctionCents)}</td>
                    )}
                    <td className="py-2.5 text-right">
                      <Money cents={r.netCents} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {session.results.some((r) => r.buyInsInferred) && (
          <p className="border-t border-ivory-line pt-2 pb-1.5 text-[11px] text-ink-muted md:border-0 md:p-0 md:text-xs">
            * Estimated as money in ÷ €5, rounded.
          </p>
        )}
      </CardPanel>

      <FeltPanel className="flex flex-col gap-1.5 pb-1.5 md:gap-4 md:pb-7">
        <SectionTitle>Unlocked this session</SectionTitle>
        {unlocks.length === 0 ? (
          <p className="pb-2.5 text-mist md:pb-0">No new achievements this time.</p>
        ) : (
          <>
            {/* Phones: one row per achievement with everyone who got it; each opens the detail. */}
            <AchievementDetailProvider
              achievements={achievementViews(stats, achievements).filter((v) =>
                unlockGroups.some((g) => g.summary.definition.id === v.id),
              )}
            >
              <ul className="md:hidden">
                {unlockGroups.map(({ summary: s, names }) => (
                  <li key={s.definition.id} className="border-t border-line first:border-0">
                    <AchievementDetailTrigger id={s.definition.id} className="flex min-h-14 w-full items-center gap-3 py-2 text-left">
                      <Badge icon={s.definition.icon} tier={s.tier} size="sm" />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-sm font-semibold">{s.definition.name}</span>
                        <span className="truncate text-xs text-brass">{names.join(", ")}</span>
                      </span>
                      <span className="tabular flex-none text-[11px] text-mist">{formatPercent(s.rarity)}</span>
                    </AchievementDetailTrigger>
                  </li>
                ))}
              </ul>
            </AchievementDetailProvider>
            <ul className="hidden grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3 md:grid">
              {unlocks.map((u) => {
                const s = summaryById.get(u.achievementId)!;
                const player = playerById.get(u.playerId)!;
                return (
                  <li key={`${u.achievementId}-${u.playerId}`} className="flex items-center gap-3">
                    <Badge icon={s.definition.icon} tier={s.tier} />
                    <span className="flex min-w-0 flex-col">
                      <span className="font-bold">{s.definition.name}</span>
                      <span className="text-[13px] text-mist">
                        <Link href={`/players/${player.slug}`} className="text-brass hover:text-ivory">
                          {player.name}
                        </Link>{" "}
                        · {formatPercent(s.rarity)} · {TIER_LABEL[s.tier]}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </FeltPanel>
    </main>
  );
}
