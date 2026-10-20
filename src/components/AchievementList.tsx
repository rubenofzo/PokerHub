"use client";

import clsx from "clsx";
import { useState } from "react";
import { AchievementDetailProvider, type AchievementView } from "./AchievementDetail";
import { AchievementRow } from "./AchievementRow";
import { CardPanel } from "./ui";

type Filter = "all" | "unlocked" | "locked";
type Sort = "rarest" | "common";

/** The Achievements page list: filter and sort controls, then one `AchievementRow` per achievement. */
export function AchievementList({ achievements, playerCount }: { achievements: AchievementView[]; playerCount: number }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("rarest");

  const unlocked = achievements.filter((a) => !a.locked).length;
  const counts: Record<Filter, number> = {
    all: achievements.length,
    unlocked,
    locked: achievements.length - unlocked,
  };
  const listed = achievements
    .filter((a) => (filter === "all" ? true : filter === "unlocked" ? !a.locked : a.locked))
    // Ties break on the displayed name; hidden ones arrive as "???" (see `redact` in views.ts).
    .sort((a, b) => (sort === "rarest" ? a.rarity - b.rarity : b.rarity - a.rarity) || a.name.localeCompare(b.name));

  return (
    <AchievementDetailProvider achievements={achievements}>
      <div className="flex flex-col gap-3 md:gap-4">
        <div className="flex items-center gap-2 md:gap-3">
          <div
            role="group"
            aria-label="Show"
            className="flex flex-1 rounded-full border border-line bg-felt-panel p-[3px] md:flex-none md:p-1"
          >
            {(["all", "unlocked", "locked"] as const).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={clsx(
                  "min-h-11 flex-1 rounded-full px-2 text-[12.5px] md:min-h-9 md:flex-none md:px-4 md:text-sm",
                  filter === f ? "bg-brass font-bold text-felt" : "font-semibold text-mist hover:text-ivory",
                )}
              >
                {f === "all" ? "All" : f === "unlocked" ? "Unlocked" : "Locked"} <span className="tabular">{counts[f]}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSort(sort === "rarest" ? "common" : "rarest")}
            aria-label={sort === "rarest" ? "Sorted rarest first; switch to most common first" : "Sorted most common first; switch to rarest first"}
            className="flex min-h-11 flex-none items-center gap-1.5 rounded-full border border-line px-3 text-xs font-semibold text-ivory hover:border-brass md:px-4 md:text-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M7 4v16" />
              <path d="M3 16l4 4 4-4" />
              <path d="M14 6h7" />
              <path d="M14 12h5" />
              <path d="M14 18h3" />
            </svg>
            {sort === "rarest" ? "Rarest" : "Most common"}
          </button>
        </div>

        <CardPanel list>
          {listed.length === 0 ? (
            <p className="py-6 text-center text-ink-muted">Nothing here yet.</p>
          ) : (
            <ul className="flex flex-col">
              {listed.map((a) => (
                <AchievementRow key={a.id} achievement={a} context="group" playerCount={playerCount} />
              ))}
            </ul>
          )}
        </CardPanel>
      </div>
    </AchievementDetailProvider>
  );
}
