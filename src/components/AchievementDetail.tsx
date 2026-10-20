"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { TIER_LABEL, type RarityTier } from "@/achievements/engine";
import { formatPercent } from "@/lib/format";
import { Badge } from "./Badge";
import { DialogClose, PlayerDot, ProgressBar } from "./ui";

export type AchievementWinner = {
  playerId: number;
  name: string;
  slug: string;
  color: string;
  /** Formatted unlock date. */
  date: string;
  sessionId: number;
};

/** One achievement, serialisable for client components. Built in `src/lib/views.ts`. */
export type AchievementView = {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: RarityTier;
  rarity: number;
  /** Greyed out: nobody has it (group view) or this player doesn't (player view). */
  locked: boolean;
  /** Hidden and locked: shown as ??? with no winner list. */
  secret: boolean;
  progress: [number, number] | null;
  /** Everyone who unlocked it, oldest first. */
  winners: AchievementWinner[];
  /** Player view only: when this player unlocked it. */
  unlockedDate: string | null;
  unlockedSessionId: number | null;
  unlockedOrder: number | null;
};

const OpenDetail = createContext<(id: string) => void>(() => {});

/**
 * Holds the achievement detail dialog for everything inside it. Wrap a section in this and
 * put `AchievementDetailTrigger`s (or `AchievementRow`s) inside to open it.
 */
export function AchievementDetailProvider({
  achievements,
  children,
}: {
  achievements: AchievementView[];
  children: React.ReactNode;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const achievement = achievements.find((a) => a.id === openId) ?? null;
  return (
    <OpenDetail.Provider value={setOpenId}>
      {children}
      <AchievementDetail achievement={achievement} onClose={() => setOpenId(null)} />
    </OpenDetail.Provider>
  );
}

/** A button that opens the detail for one achievement. */
export function AchievementDetailTrigger({
  id,
  className,
  children,
  label,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
  label?: string;
}) {
  const open = useContext(OpenDetail);
  return (
    <button type="button" aria-label={label} aria-haspopup="dialog" onClick={() => open(id)} className={className}>
      {children}
    </button>
  );
}

/** Bottom sheet on phones, centred modal from `md`. */
function AchievementDetail({ achievement, onClose }: { achievement: AchievementView | null; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  // Keep showing the last achievement while the dialog closes.
  const [shown, setShown] = useState(achievement);
  if (achievement && achievement !== shown) setShown(achievement);

  useEffect(() => {
    const d = dialog.current;
    if (achievement && d && !d.open) d.showModal();
  }, [achievement]);

  const a = shown;
  return (
    <dialog
      ref={dialog}
      aria-labelledby="achievement-detail-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialog.current) dialog.current?.close();
      }}
      className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[85dvh] w-full max-w-none rounded-t-[22px] bg-ivory p-0 text-ink shadow-[0_-10px_30px_rgba(0,0,0,0.35)] md:inset-0 md:m-auto md:h-fit md:w-[min(560px,calc(100vw-32px))] md:rounded-[20px] md:shadow-2xl"
    >
      {a && (
        <div className="flex max-h-[85dvh] flex-col overflow-y-auto px-5 pt-2.5 pb-[calc(28px+env(safe-area-inset-bottom))] md:p-6">
          <div aria-hidden className="mx-auto mb-3.5 h-1 w-10 flex-none rounded-full bg-ivory-line md:hidden" />
          <div className="flex items-center gap-3.5">
            <span className={a.locked ? "rounded-full bg-felt" : undefined}>
              <Badge icon={a.icon} tier={a.tier} locked={a.locked} hidden={a.secret} size="detail" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="achievement-detail-title" className="font-display text-[26px] leading-[1.1] md:text-3xl">
                {a.secret ? "???" : a.name}
              </h2>
              <p className="tabular mt-1 text-[12.5px] text-ink-muted md:text-sm">
                <b className="text-ink">{formatPercent(a.rarity)}</b> of players · {TIER_LABEL[a.tier]}
              </p>
            </div>
            <DialogClose onClick={() => dialog.current?.close()} />
          </div>

          <p className="mt-3.5 text-sm leading-normal md:text-base">{a.secret ? "Hidden achievement" : a.description}</p>

          {a.locked && a.progress && <ProgressBar value={a.progress} className="mt-3" />}

          {!a.secret && (
            <>
              <h3 className="mt-5 mb-1.5 text-[10px] font-bold tracking-[0.14em] text-ink-muted uppercase md:text-xs">
                {a.winners.length === 0
                  ? "Nobody has unlocked this yet"
                  : `Unlocked by ${a.winners.length} ${a.winners.length === 1 ? "player" : "players"}`}
              </h3>
              <ul className="flex flex-col">
                {a.winners.map((w) => (
                  <li key={w.playerId} className="flex min-h-11 items-center gap-2.5 border-t border-ivory-line">
                    <PlayerDot color={w.color} />
                    <Link
                      href={`/players/${w.slug}`}
                      onClick={() => dialog.current?.close()}
                      className="flex-1 py-2.5 text-[14.5px] font-semibold text-ink hover:text-brass-dark">
                      {w.name}
                    </Link>
                    <Link
                      href={`/sessions/${w.sessionId}`}
                      onClick={() => dialog.current?.close()}
                      className="tabular py-2.5 text-xs text-ink-muted hover:text-brass-dark">
                      {w.date}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </dialog>
  );
}
