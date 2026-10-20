/**
 * Dates and times of upcoming sessions. Pure functions, no database, so they are easy to test.
 * Times are entered and shown in Europe/Amsterdam; the server turns date + time into one UTC
 * instant, so the countdown is right for every viewer and across daylight saving changes.
 */

export const TIME_ZONE = "Europe/Amsterdam";

/** After a session with a known start time starts, it reads "Dealing now" for this long. */
export const DEALING_WINDOW_MS = 6 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const wallClock = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** Milliseconds Amsterdam is ahead of UTC at the given instant (+1h in winter, +2h in summer). */
function zoneOffsetMs(utcMs: number): number {
  const parts = Object.fromEntries(wallClock.formatToParts(new Date(utcMs)).map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

/** "20:00:00" or "20:00" → "20:00"; null stays null. */
export function shortTime(time: string | null): string | null {
  if (!time) return null;
  const m = time.match(/^(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : null;
}

/**
 * The UTC instant a session starts: `date` + `time` read as Amsterdam wall-clock time. With a
 * date but no time it is the start of that day; with no date there is no instant (null).
 */
export function startInstant(date: string | null, time: string | null): Date | null {
  if (!date) return null;
  const d = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!d) return null;
  const t = shortTime(time) ?? "00:00";
  const [hour, minute] = t.split(":").map(Number);
  const wall = Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3]), hour, minute);
  // Guess with the offset at the wall time, then correct once with the offset at the result,
  // which settles both sides of a DST change.
  let utc = wall - zoneOffsetMs(wall);
  utc = wall - zoneOffsetMs(utc);
  return new Date(utc);
}

export type Duration = { days: number; hours: number; minutes: number; seconds: number };

/** Splits a duration into whole days, hours, minutes and seconds (never negative). */
export function splitDuration(ms: number): Duration {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

/**
 * Where a session is relative to `now`: counting down, started ("dealing"), on its day when the
 * time is TBD ("today"), or over without results yet ("waiting").
 */
export type Phase = "countdown" | "dealing" | "today" | "waiting";

export function countdownPhase(startMs: number, nowMs: number, timeKnown: boolean): Phase {
  if (nowMs < startMs) return "countdown";
  if (timeKnown) return nowMs < startMs + DEALING_WINDOW_MS ? "dealing" : "waiting";
  return nowMs < startMs + DAY_MS ? "today" : "waiting";
}

/** "Fri 24 Oct" (with the year when asked), or "Date TBD". */
export function formatSessionDate(date: string | null, opts: { year?: boolean } = {}): string {
  if (!date) return "Date TBD";
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: opts.year ? "numeric" : undefined,
    timeZone: "UTC",
  });
}

/** "Fri 24 Oct · 20:00", "Fri 24 Oct · Time TBD", "Date TBD · 20:00" or "Date TBD". */
export function formatSchedule(date: string | null, time: string | null): string {
  const t = shortTime(time);
  if (!date) return t ? `Date TBD · ${t}` : "Date TBD";
  return `${formatSessionDate(date)} · ${t ?? "Time TBD"}`;
}
