import { describe, expect, it } from "vitest";
import { fixturePlayers, fixtureSessions } from "./fixtures";
import { computeStats, inferBuyIns, spreadImbalance } from "./stats";

describe("spreadImbalance", () => {
  it("splits evenly and gives leftover cents to the first players", () => {
    const shares = spreadImbalance(35, [1, 2, 3, 4, 5, 6, 7, 8]);
    expect([...shares.values()]).toEqual([5, 5, 5, 4, 4, 4, 4, 4]);
    expect([...shares.values()].reduce((a, b) => a + b, 0)).toBe(35);
  });

  it("handles negative imbalances (more out than in)", () => {
    const shares = spreadImbalance(-7, [1, 2, 3]);
    expect([...shares.values()]).toEqual([-3, -2, -2]);
  });
});

describe("inferBuyIns", () => {
  it("rounds money in to the nearest €5 buy-in", () => {
    expect(inferBuyIns(500)).toBe(1);
    expect(inferBuyIns(1665)).toBe(3);
    expect(inferBuyIns(3000)).toBe(6);
    expect(inferBuyIns(0)).toBe(0);
  });
});

describe("computeStats", () => {
  const stats = computeStats(fixturePlayers, fixtureSessions);
  const byName = (name: string) => stats.players.find((p) => p.player.name === name)!;

  it("orders sessions by date and numbers them", () => {
    expect(stats.sessions.map((s) => [s.id, s.number])).toEqual([
      [1, 1],
      [2, 2],
    ]);
  });

  it("makes every session sum to zero after spreading the imbalance", () => {
    for (const s of stats.sessions) {
      expect(s.results.reduce((sum, r) => sum + r.netCents, 0)).toBe(0);
    }
    expect(stats.sessions[1].imbalanceCents).toBe(35);
  });

  it("computes all-time standings", () => {
    expect(stats.players[0].player.name).toBe("Sam");
    expect(byName("Sam").netCents).toBe(2325 + 4); // Chion, Hidde and Koen come first alphabetically and take the extra cents
    expect(byName("Tibbe").netCents).toBe(-2580 + 70 + 4);
    expect(byName("Tibbe").rank).toBe(9);
    expect(stats.players.reduce((s, p) => s + p.netCents, 0)).toBe(0);
  });

  it("computes per-player stats", () => {
    const tijs = byName("Tijs");
    expect(tijs.sessionsPlayed).toBe(2);
    expect(tijs.winRate).toBe(0.5);
    expect(tijs.biggestWin?.netCents).toBe(1205);
    expect(tijs.biggestLoss?.sessionId).toBe(2);
    expect(tijs.attendance).toBe(1);
    expect(byName("Tibbe").rebuys).toBe(5);
    expect(byName("Sam").attendance).toBe(0.5);
  });

  it("builds a timeline starting at zero", () => {
    expect(stats.timeline).toHaveLength(3);
    expect(stats.timeline[0].balances[1]).toBe(0);
    const tijsId = byName("Tijs").player.id;
    expect(stats.timeline[1].balances[tijsId]).toBe(1205);
  });
});

describe("computeStats with upcoming sessions", () => {
  const upcoming = { id: 99, date: "2026-10-09", note: null, results: [] };
  const withEmpty = computeStats(fixturePlayers, [...fixtureSessions, upcoming]);
  const without = computeStats(fixturePlayers, fixtureSessions);

  it("ignores sessions without results", () => {
    expect(withEmpty.sessions.map((s) => s.id)).toEqual([1, 2]);
    expect(withEmpty.sessions.map((s) => s.number)).toEqual([1, 2]);
    expect(withEmpty.timeline).toHaveLength(3);
    expect(withEmpty.players).toEqual(without.players);
  });
});
