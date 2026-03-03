import { describe, it, expect } from "vitest";
import { isSkinUnlocked } from "../lib/skin-unlocker";
import { SKINS } from "@fangdash/shared/skins";

const defaultStats = {
  highestScore: 0,
  highestDistance: 0,
  gamesPlayed: 0,
  achievementIds: new Set<string>(),
};

describe("isSkinUnlocked", () => {
  it("default skins are always unlocked", () => {
    const grayWolf = SKINS.find((s) => s.id === "gray-wolf")!;
    expect(isSkinUnlocked(grayWolf, defaultStats)).toBe(true);
  });

  it("score-based skins unlock at threshold", () => {
    const fireWolf = SKINS.find((s) => s.id === "fire-wolf")!;
    expect(
      isSkinUnlocked(fireWolf, { ...defaultStats, highestScore: 4999 })
    ).toBe(false);
    expect(
      isSkinUnlocked(fireWolf, { ...defaultStats, highestScore: 5000 })
    ).toBe(true);
  });

  it("distance-based skins unlock at threshold", () => {
    const shadowWolf = SKINS.find((s) => s.id === "shadow-wolf")!;
    expect(
      isSkinUnlocked(shadowWolf, { ...defaultStats, highestDistance: 1999 })
    ).toBe(false);
    expect(
      isSkinUnlocked(shadowWolf, { ...defaultStats, highestDistance: 2000 })
    ).toBe(true);
  });

  it("achievement-based skins unlock when achievement is earned", () => {
    const stormWolf = SKINS.find((s) => s.id === "storm-wolf")!;
    expect(isSkinUnlocked(stormWolf, defaultStats)).toBe(false);
    expect(
      isSkinUnlocked(stormWolf, {
        ...defaultStats,
        achievementIds: new Set(["obstacle-master"]),
      })
    ).toBe(true);
  });

  it("mrdemonwolf unlocks with champion achievement", () => {
    const mrdemonwolf = SKINS.find((s) => s.id === "mrdemonwolf")!;
    expect(
      isSkinUnlocked(mrdemonwolf, {
        ...defaultStats,
        achievementIds: new Set(["champion"]),
      })
    ).toBe(true);
  });

  it("every skin has a valid unlock condition", () => {
    for (const skin of SKINS) {
      const result = isSkinUnlocked(skin, defaultStats);
      expect(typeof result).toBe("boolean");
    }
  });
});
