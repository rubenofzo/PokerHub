import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/Badge";
import { CardPanel, FeltPanel, KpiCard, Money, SectionTitle } from "@/components/ui";
import { TIER_LABEL } from "@/achievements/engine";
import { isAdmin } from "@/lib/auth";
import { getHub } from "@/lib/data";
import { formatDate, formatPercent } from "@/lib/format";
import { formatEuro, formatSigned } from "@/lib/money";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { stats } = await getHub();
  const session = stats.sessions.find((s) => s.id === Number(id));
  return { title: session ? `Session ${formatDate(session.date)}` : "Session" };
}

export default async function SessionPage({ params }: Props) {
  const { id } = await params;
  const { stats, achievements, playerById } = await getHub();
  const session = stats.sessions.find((s) => s.id === Number(id));
  if (!session) notFound();
  const admin = await isAdmin();

  const summaryById = new Map(achievements.summaries.map((s) => [s.definition.id, s]));
  const unlocks = achievements.recent
    .filter((u) => u.sessionId === session.id)
    .sort((a, b) => (summaryById.get(a.achievementId)?.rarity ?? 0) - (summaryById.get(b.achievementId)?.rarity ?? 0));
  const top = session.results[0];
  const bottom = session.results.at(-1)!;
  const hasCorrection = session.imbalanceCents !== 0;

  return (
    <main className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link href="/" className="text-sm font-semibold text-brass">
            ← Dashboard
          </Link>
          <h1 className="font-display text-5xl">{formatDate(session.date)}</h1>
          <span className="text-mist">
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

      <section aria-label="Key numbers" className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-5">
        <KpiCard suit="♠" label="Players" value={session.results.length} />
        <KpiCard suit="♦" label="Pot" value={formatEuro(session.potCents)} sub="Total bought in" />
        <KpiCard
          suit="♣"
          label="Shark"
          value={playerById.get(top.playerId)?.name}
          sub={formatSigned(top.netCents)}
        />
        <KpiCard
          suit="♥"
          label="Donor"
          value={playerById.get(bottom.playerId)?.name}
          sub={formatSigned(bottom.netCents)}
        />
      </section>

      <CardPanel className="flex flex-col gap-3">
        <SectionTitle>Results</SectionTitle>
        {hasCorrection && (
          <p className="rounded-xl bg-ivory-line/60 px-4 py-3 text-sm text-ink-muted">
            The sheet was {formatEuro(Math.abs(session.imbalanceCents))}{" "}
            {session.imbalanceCents > 0 ? "short (more went in than came out)" : "over (more came out than went in)"}.
            That difference is split evenly over everyone at the table, shown under Spread.
          </p>
        )}
        <div className="overflow-x-auto">
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
          <p className="text-xs text-ink-muted">* Estimated as money in ÷ €5, rounded.</p>
        )}
      </CardPanel>

      <FeltPanel className="flex flex-col gap-4">
        <SectionTitle>Unlocked this session</SectionTitle>
        {unlocks.length === 0 ? (
          <p className="text-mist">No new achievements this time.</p>
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
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
        )}
      </FeltPanel>
    </main>
  );
}
