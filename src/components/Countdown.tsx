"use client";

import clsx from "clsx";
import { useSyncExternalStore } from "react";
import { countdownPhase, splitDuration } from "@/lib/schedule";

/** One shared one-second clock. The server snapshot is null, so nothing time-based is in the HTML. */
function subscribe(onTick: () => void) {
  const timer = setInterval(onTick, 1000);
  return () => clearInterval(timer);
}
const nowSecond = () => Math.floor(Date.now() / 1000);

const UNITS = [
  ["days", "Days"],
  ["hours", "Hours"],
  ["minutes", "Min"],
  ["seconds", "Sec"],
] as const;

const STATUS = { dealing: "Dealing now", today: "Today", waiting: "Waiting for results" } as const;

/**
 * Days, hours, minutes and seconds to `startsAt` (a UTC instant from the server), in the
 * display serif. `hero` is the big one on the session page, `card` the home card. Once the
 * start passes it reads "Dealing now" (or "Today" when the time is TBD), later "Waiting for
 * results". The server renders it at `serverNow` (the request time) and hydration uses that
 * same time, so the HTML matches and nothing shifts; then it ticks every second.
 */
export function Countdown({
  startsAt,
  timeKnown,
  serverNow,
  size = "card",
  className,
}: {
  startsAt: string;
  timeKnown: boolean;
  serverNow: number;
  size?: "hero" | "card";
  className?: string;
}) {
  const now = useSyncExternalStore(subscribe, nowSecond, () => Math.floor(serverNow / 1000));
  const start = Date.parse(startsAt);
  const phase = countdownPhase(start, now * 1000, timeKnown);
  const hero = size === "hero";

  if (phase !== "countdown") {
    return (
      <p
        role="timer"
        className={clsx(
          "font-display leading-none text-brass",
          hero ? "text-[40px] md:text-[64px]" : "text-[30px] md:text-[44px]",
          className,
        )}
      >
        {STATUS[phase]}
      </p>
    );
  }

  const parts = splitDuration(start - now * 1000);
  return (
    <div
      role="timer"
      aria-label={`${parts.days} days, ${parts.hours} hours and ${parts.minutes} minutes to go`}
      className={clsx("grid grid-cols-4", hero ? "gap-2 md:gap-4" : "gap-1.5 md:gap-3", className)}
    >
      {UNITS.map(([key, label]) => (
        <div
          key={key}
          className={clsx(
            "flex flex-col items-center rounded-xl border border-line bg-felt-deep/60",
            hero ? "py-2.5 md:rounded-2xl md:py-4" : "py-2 md:py-3",
          )}
        >
          <span
            className={clsx(
              "tabular font-display leading-none text-ivory",
              hero ? "text-[38px] md:text-[64px]" : "text-[28px] md:text-[40px]",
            )}
          >
            {String(parts[key]).padStart(2, "0")}
          </span>
          <span className="mt-1 text-[9.5px] font-bold tracking-[0.14em] text-mist uppercase md:mt-1.5 md:text-xs">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
