import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/Badge";
import { CardPanel, SectionTitle } from "@/components/ui";
import { TIER_LABEL } from "@/achievements/engine";
import { getHub } from "@/lib/data";
import { formatPercent } from "@/lib/format";

export const metadata: Metadata = { title: "Achievements" };

export default async function AchievementsPage() {
  const { achievements, playerById, stats } = await getHub();
  const list = [...achievements.summaries].sort(
    (a, b) => a.rarity - b.rarity || a.definition.name.localeCompare(b.definition.name),
  );

  return (
    <main className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-5xl">Achievements</h1>
        <p className="text-mist">
          Rarity is the share of the {stats.players.length} players who have earned it. Rarest first.
        </p>
      </div>
      <CardPanel>
        <ul className="flex flex-col">
          {list.map((s) => {
            const secret = !!s.definition.hidden && s.unlocks.length === 0;
            return (
              <li
                key={s.definition.id}
                className="flex flex-wrap items-center gap-4 border-b border-ivory-line py-4 last:border-0"
              >
                <span className={s.unlocks.length === 0 ? "rounded-full bg-felt" : undefined}>
                  <Badge icon={s.definition.icon} tier={s.tier} locked={s.unlocks.length === 0} hidden={secret} />
                </span>
                <span className="flex min-w-[200px] flex-1 flex-col gap-0.5">
                  <span className="text-lg font-bold">{secret ? "???" : s.definition.name}</span>
                  <span className="text-sm text-ink-muted">{secret ? "Hidden achievement" : s.definition.description}</span>
                  {s.unlocks.length > 0 && (
                    <span className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-sm">
                      {s.unlocks.map((u) => {
                        const p = playerById.get(u.playerId)!;
                        return (
                          <Link key={u.playerId} href={`/players/${p.slug}`} className="font-semibold text-brass-dark underline">
                            {p.name}
                          </Link>
                        );
                      })}
                    </span>
                  )}
                </span>
                <span className="flex flex-none flex-col items-end">
                  <SectionTitle className="!text-2xl">{formatPercent(s.rarity)}</SectionTitle>
                  <span className="text-xs font-bold tracking-[0.12em] text-ink-muted uppercase">{TIER_LABEL[s.tier]}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </CardPanel>
    </main>
  );
}
