import { describe, expect, it } from "vitest";
import { fixturePlayers, fixtureSessions } from "@/lib/fixtures";
import { computeStats } from "@/lib/stats";
import { evaluateAchievements, rarityTier } from "./engine";
import type { AchievementDefinition } from "./types";

const stats = computeStats(fixturePlayers, fixtureSessions);
const results = evaluateAchievements(stats);
const idOf = (name: string) => fixturePlayers.find((p) => p.name === name)!.id;
const earned = (name: string) =>
  results.byPlayer
    .get(idOf(name))!
    .filter((a) => a.unlocked)
    .map((a) => a.definition.id)
    .sort();
const summary = (id: string) => results.summaries.find((s) => s.definition.id === id)!;

describe("evaluateAchievements", () => {
  it("unlocks the right achievements for the two real sessions", () => {
    expect(earned("Tijs")).toEqual(
      ["busted", "donor", "double-up", "first-hand", "in-the-green", "king-of-the-table", "shark"].sort(),
    );
    expect(earned("Tibbe")).toEqual(["donor", "first-hand", "high-roller", "in-the-green"].sort());
    expect(earned("Arjan")).toEqual(["dead-even", "first-hand"]);
  });

  it("records the session an achievement was first earned", () => {
    const shark = results.byPlayer.get(idOf("Tijs"))!.find((a) => a.definition.id === "shark")!;
    expect(shark.unlocked?.sessionId).toBe(1);
    const king = results.byPlayer.get(idOf("Sam"))!.find((a) => a.definition.id === "king-of-the-table")!;
    expect(king.unlocked?.sessionId).toBe(2);
  });

  it("computes rarity as the share of players who earned it", () => {
    expect(summary("first-hand").rarity).toBe(1);
    expect(summary("busted").rarity).toBeCloseTo(1 / 9);
    expect(summary("busted").tier).toBe("rare");
    expect(summary("comeback-kid").unlocks).toHaveLength(0);
  });

  it("reports progress on locked achievements", () => {
    const regular = results.byPlayer.get(idOf("Tijs"))!.find((a) => a.definition.id === "regular")!;
    expect(regular.unlocked).toBeNull();
    expect(regular.progress).toEqual([2, 10]);
  });

  it("lists unlocks newest first", () => {
    expect(results.recent[0].sessionId).toBe(2);
  });

  it("survives a broken definition", () => {
    const broken: AchievementDefinition = {
      id: "broken",
      name: "Broken",
      description: "",
      icon: "x",
      check: () => {
        throw new Error("boom");
      },
    };
    const r = evaluateAchievements(stats, [broken]);
    expect(r.summaries[0].unlocks).toHaveLength(0);
  });
});

describe("rarityTier", () => {
  it("maps percentages to tiers", () => {
    expect(rarityTier(1)).toBe("common");
    expect(rarityTier(0.4)).toBe("uncommon");
    expect(rarityTier(0.2)).toBe("rare");
    expect(rarityTier(0.1)).toBe("ultra");
  });
});
