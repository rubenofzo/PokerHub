import { describe, expect, it } from "vitest";
import {
  countdownPhase,
  DEALING_WINDOW_MS,
  formatSchedule,
  nextMidnight,
  shortTime,
  splitDuration,
  startInstant,
} from "./schedule";

describe("startInstant", () => {
  it("reads date and time as Amsterdam time (CEST in summer, CET in winter)", () => {
    expect(startInstant("2026-07-10", "20:00")?.toISOString()).toBe("2026-07-10T18:00:00.000Z");
    expect(startInstant("2026-12-04", "20:00:00")?.toISOString()).toBe("2026-12-04T19:00:00.000Z");
  });

  it("uses the start of the day when the time is TBD", () => {
    expect(startInstant("2026-10-24", null)?.toISOString()).toBe("2026-10-23T22:00:00.000Z");
  });

  it("has no instant when the date is TBD", () => {
    expect(startInstant(null, "20:00")).toBeNull();
    expect(startInstant(null, null)).toBeNull();
  });

  it("handles the DST changeovers", () => {
    // Clocks go back on 25 Oct 2026 at 03:00 CEST: the evening is already CET.
    expect(startInstant("2026-10-24", "20:00")?.toISOString()).toBe("2026-10-24T18:00:00.000Z");
    expect(startInstant("2026-10-25", "20:00")?.toISOString()).toBe("2026-10-25T19:00:00.000Z");
    // Clocks go forward on 29 Mar 2026 at 02:00 CET.
    expect(startInstant("2026-03-28", "20:00")?.toISOString()).toBe("2026-03-28T19:00:00.000Z");
    expect(startInstant("2026-03-29", "20:00")?.toISOString()).toBe("2026-03-29T18:00:00.000Z");
    // 02:30 doesn't exist that night; it lands on 03:30 CEST.
    expect(startInstant("2026-03-29", "02:30")?.toISOString()).toBe("2026-03-29T01:30:00.000Z");
  });
});

describe("splitDuration", () => {
  it("splits into days, hours, minutes and seconds", () => {
    expect(splitDuration(((2 * 24 + 3) * 3600 + 4 * 60 + 5) * 1000 + 999)).toEqual({
      days: 2,
      hours: 3,
      minutes: 4,
      seconds: 5,
    });
  });

  it("never goes negative once the start has passed", () => {
    expect(splitDuration(-5000)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  });
});

describe("countdownPhase", () => {
  const start = Date.UTC(2026, 9, 24, 18);
  it("counts down before the start", () => {
    expect(countdownPhase(start, start - 1000, true)).toBe("countdown");
  });
  it("reads dealing just after a known start, then waiting for results", () => {
    expect(countdownPhase(start, start, true)).toBe("dealing");
    expect(countdownPhase(start, start + DEALING_WINDOW_MS - 1, true)).toBe("dealing");
    expect(countdownPhase(start, start + DEALING_WINDOW_MS, true)).toBe("waiting");
  });
  it("reads today for the whole Amsterdam day when the time is TBD", () => {
    const day = startInstant("2026-10-22", null)!.getTime();
    expect(countdownPhase(day, day + 20 * 3600 * 1000, false)).toBe("today");
    expect(countdownPhase(day, day + 24 * 3600 * 1000, false)).toBe("waiting");
  });
  it("ends today at the next midnight on a 25-hour DST day", () => {
    // 25 Oct 2026: clocks go back, so the day runs 22:00Z on the 24th to 23:00Z on the 25th.
    const day = startInstant("2026-10-25", null)!.getTime();
    expect(nextMidnight(day)).toBe(Date.UTC(2026, 9, 25, 23));
    expect(countdownPhase(day, day + 24.5 * 3600 * 1000, false)).toBe("today");
    expect(countdownPhase(day, day + 25 * 3600 * 1000, false)).toBe("waiting");
    // 29 Mar 2026 is 23 hours long.
    expect(nextMidnight(startInstant("2026-03-29", null)!.getTime())).toBe(Date.UTC(2026, 2, 29, 22));
  });
});

describe("formatSchedule", () => {
  it("formats date and time, or says what is TBD", () => {
    expect(formatSchedule("2026-10-24", "20:00:00")).toBe("Sat 24 Oct · 20:00");
    expect(formatSchedule("2026-10-24", null)).toBe("Sat 24 Oct · Time TBD");
    expect(formatSchedule(null, "20:00")).toBe("Date TBD · 20:00");
    expect(formatSchedule(null, null)).toBe("Date TBD");
    expect(shortTime("9:00")).toBeNull();
  });
});
