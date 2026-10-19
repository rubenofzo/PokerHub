"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { TIER_LABEL, type RarityTier } from "@/achievements/engine";
import { Badge } from "./Badge";

export type ShowcaseItem = {
  id: string;
  name: string;
  description: string;
  icon: string;
  hidden: boolean;
  tier: RarityTier;
  rarity: number;
  /** Position of the unlocking session in date order, for "most recent". */
  unlockedOrder: number | null;
  unlockedDate: string | null;
  unlockedSessionId: number | null;
  progress: [number, number] | null;
};

type Sort = "rarest" | "common" | "recent" | "name";
type Filter = "all" | "earned" | "locked";

const pct = (r: number) => `${Math.round(r * 100)}%`;

function sortItems(items: ShowcaseItem[], sort: Sort): ShowcaseItem[] {
  return [...items].sort((a, b) => {
    switch (sort) {
      case "rarest":
        return a.rarity - b.rarity || a.name.localeCompare(b.name);
      case "common":
        return b.rarity - a.rarity || a.name.localeCompare(b.name);
      case "recent":
        return (b.unlockedOrder ?? -1) - (a.unlockedOrder ?? -1) || a.name.localeCompare(b.name);
      case "name":
        return a.name.localeCompare(b.name);
    }
  });
}

export function AchievementShowcase({ items, playerName }: { items: ShowcaseItem[]; playerName: string }) {
  const [tab, setTab] = useState<"recent" | "rarest">("recent");
  const [sort, setSort] = useState<Sort>("rarest");
  const [filter, setFilter] = useState<Filter>("all");
  const dialog = useRef<HTMLDialogElement>(null);

  const earned = items.filter((i) => i.unlockedDate);
  const showcase = sortItems(earned, tab).slice(0, 5);
  // Like Steam: earned achievements first, then locked ones, each in the chosen order.
  const listed = [
    ...(filter === "locked" ? [] : sortItems(earned, sort)),
    ...(filter === "earned" ? [] : sortItems(items.filter((i) => !i.unlockedDate), sort)),
  ];

  return (
    <section className="flex flex-col gap-4 rounded-[20px] border border-line bg-felt-panel p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-[26px] sm:text-3xl">
          Achievements{" "}
          <span className="font-sans text-base font-semibold text-mist">
            {earned.length} / {items.length}
          </span>
        </h2>
        <div role="tablist" aria-label="Showcase" className="flex rounded-full border border-line p-1">
          {(["recent", "rarest"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              type="button"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`min-h-9 rounded-full px-4 text-sm font-bold ${tab === t ? "bg-brass text-felt" : "text-mist"}`}
            >
              {t === "recent" ? "Most recent" : "Rarest"}
            </button>
          ))}
        </div>
      </div>

      {showcase.length === 0 ? (
        <p className="text-mist">No achievements yet.</p>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
          {showcase.map((a) => (
            <li key={a.id} className="flex flex-col items-center gap-2 rounded-[14px] bg-felt-deep/60 p-4 text-center">
              <Badge icon={a.icon} tier={a.tier} size="lg" />
              <span className="font-bold">{a.name}</span>
              <span className="text-[13px] text-mist">
                {pct(a.rarity)} · {TIER_LABEL[a.tier]}
              </span>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="min-h-11 self-start rounded-full border-2 border-brass px-5 font-bold text-brass hover:bg-brass hover:text-felt"
      >
        View all achievements
      </button>

      <dialog
        ref={dialog}
        aria-labelledby="all-achievements-title"
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
        className="m-auto max-h-[85vh] w-[min(720px,calc(100vw-32px))] rounded-[20px] bg-ivory p-0 text-ink shadow-2xl"
      >
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex flex-col gap-3 border-b border-ivory-line p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <h2 id="all-achievements-title" className="font-display text-3xl">
                {playerName}&rsquo;s achievements
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => dialog.current?.close()}
                className="flex h-11 w-11 flex-none items-center justify-center rounded-full text-2xl text-ink-muted hover:bg-ivory-line"
              >
                ×
              </button>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <label className="flex items-center gap-2 font-semibold text-ink-muted">
                Sort
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as Sort)}
                  className="min-h-10 rounded-lg border border-ivory-line bg-white px-2 text-ink"
                >
                  <option value="rarest">Rarest first</option>
                  <option value="common">Most common first</option>
                  <option value="recent">Recently unlocked</option>
                  <option value="name">Name</option>
                </select>
              </label>
              <label className="flex items-center gap-2 font-semibold text-ink-muted">
                Show
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as Filter)}
                  className="min-h-10 rounded-lg border border-ivory-line bg-white px-2 text-ink"
                >
                  <option value="all">All</option>
                  <option value="earned">Earned</option>
                  <option value="locked">Locked</option>
                </select>
              </label>
            </div>
          </div>
          <ul className="flex flex-col overflow-y-auto px-5 pb-5 sm:px-6">
            {listed.map((a) => {
              const locked = !a.unlockedDate;
              const secret = locked && a.hidden;
              return (
                <li key={a.id} className="flex items-center gap-4 border-b border-ivory-line py-3.5 last:border-0">
                  <span className={locked ? "rounded-full bg-felt" : undefined}>
                    <Badge icon={a.icon} tier={a.tier} locked={locked} hidden={secret} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className={`font-bold ${locked ? "text-ink-muted" : ""}`}>{secret ? "???" : a.name}</span>
                    <span className="text-sm text-ink-muted">{secret ? "Hidden achievement" : a.description}</span>
                    {locked && a.progress && (
                      <span className="mt-1 flex items-center gap-2 text-xs font-semibold text-ink-muted">
                        <span className="h-1.5 w-28 overflow-hidden rounded-full bg-ivory-line">
                          <span
                            className="block h-full bg-brass-dark"
                            style={{ width: `${(a.progress[0] / a.progress[1]) * 100}%` }}
                          />
                        </span>
                        {a.progress[0]} / {a.progress[1]}
                      </span>
                    )}
                  </span>
                  <span className="flex flex-none flex-col items-end gap-0.5 text-right text-sm">
                    <span className="font-bold">{pct(a.rarity)}</span>
                    {a.unlockedDate && a.unlockedSessionId ? (
                      <Link href={`/sessions/${a.unlockedSessionId}`} className="text-xs text-brass-dark underline">
                        {a.unlockedDate}
                      </Link>
                    ) : (
                      <span className="text-xs text-ink-muted">Locked</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </dialog>
    </section>
  );
}
