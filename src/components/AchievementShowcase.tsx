"use client";

import { useRef, useState } from "react";
import { TIER_LABEL } from "@/achievements/engine";
import { formatPercent } from "@/lib/format";
import { AchievementDetailProvider, AchievementDetailTrigger, type AchievementView } from "./AchievementDetail";
import { AchievementRow } from "./AchievementRow";
import { Badge } from "./Badge";

type Sort = "rarest" | "common" | "recent" | "name";
type Filter = "all" | "earned" | "locked";

function sortItems(items: AchievementView[], sort: Sort): AchievementView[] {
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

/**
 * A player's achievements: a showcase (a swipeable row of every earned badge on phones, the top
 * five as cards on desktop) and a "view all" dialog (full screen on phones) of `AchievementRow`s.
 * Every badge and row opens `AchievementDetail`.
 */
export function AchievementShowcase({ items, playerName }: { items: AchievementView[]; playerName: string }) {
  const [tab, setTab] = useState<"recent" | "rarest">("recent");
  const [sort, setSort] = useState<Sort>("rarest");
  const [filter, setFilter] = useState<Filter>("all");
  const dialog = useRef<HTMLDialogElement>(null);

  const earned = items.filter((i) => !i.locked);
  const showcase = sortItems(earned, tab);
  // Like Steam: earned achievements first, then locked ones, each in the chosen order.
  const listed = [
    ...(filter === "locked" ? [] : sortItems(earned, sort)),
    ...(filter === "earned" ? [] : sortItems(items.filter((i) => i.locked), sort)),
  ];
  const openAll = () => dialog.current?.showModal();

  return (
    <AchievementDetailProvider achievements={items}>
      <section className="flex flex-col gap-3.5 rounded-2xl border border-line bg-felt-panel px-3.5 py-4 md:gap-4 md:rounded-[20px] md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-[22px] md:text-3xl">
            Achievements{" "}
            <span className="font-sans text-[13px] font-semibold text-mist md:text-base">
              {earned.length} / {items.length}
            </span>
          </h2>
          <button type="button" onClick={openAll} className="min-h-11 text-xs font-semibold text-brass md:hidden">
            View all →
          </button>
          <div role="tablist" aria-label="Showcase" className="hidden rounded-full border border-line p-1 md:flex">
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
          <ul className="no-scrollbar -mx-3.5 flex gap-3.5 overflow-x-auto px-3.5 md:mx-0 md:grid md:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] md:gap-3 md:overflow-visible md:px-0">
            {showcase.map((a) => (
              // Desktop shows the top five only.
              <li key={a.id} className="flex w-[72px] flex-none md:w-auto md:[&:nth-child(n+6)]:hidden">
                <AchievementDetailTrigger
                  id={a.id}
                  className="flex w-full flex-col items-center gap-1.5 text-center md:gap-2 md:rounded-[14px] md:bg-felt-deep/60 md:p-4"
                >
                  <Badge icon={a.icon} tier={a.tier} size="showcase" />
                  <span className="w-full truncate text-[11.5px] font-semibold md:text-base md:font-bold md:whitespace-normal">
                    {a.name}
                  </span>
                  <span className="text-[10.5px] text-mist md:text-[13px]">
                    {formatPercent(a.rarity)}
                    <span className="hidden md:inline"> · {TIER_LABEL[a.tier]}</span>
                  </span>
                </AchievementDetailTrigger>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={openAll}
          className="hidden min-h-11 self-start rounded-full border-2 border-brass px-5 font-bold text-brass hover:bg-brass hover:text-felt md:block"
        >
          View all achievements
        </button>

        <dialog
          ref={dialog}
          aria-labelledby="all-achievements-title"
          onClick={(e) => {
            if (e.target === dialog.current) dialog.current?.close();
          }}
          className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none bg-ivory p-0 text-ink md:m-auto md:h-auto md:max-h-[85vh] md:w-[min(720px,calc(100vw-32px))] md:rounded-[20px] md:shadow-2xl"
        >
          <div className="flex h-full flex-col md:max-h-[85vh]">
            <div className="flex flex-col gap-3 border-b border-ivory-line px-4 pt-[calc(16px+env(safe-area-inset-top))] pb-4 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <h2 id="all-achievements-title" className="font-display text-[26px] leading-tight md:text-3xl">
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
            <ul className="flex flex-col overflow-y-auto px-4 pb-[calc(16px+env(safe-area-inset-bottom))] md:px-6 md:pb-5">
              {listed.map((a) => (
                <AchievementRow key={a.id} achievement={a} context="player" />
              ))}
            </ul>
          </div>
        </dialog>
      </section>
    </AchievementDetailProvider>
  );
}
