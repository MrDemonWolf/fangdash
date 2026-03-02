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
    const arcticWolf = SKINS.find((s) => s.id === "arctic-wolf")!;
    expect(
      isSkinUnlocked(arcticWolf, { ...defaultStats, highestScore: 999 })
    ).toBe(false);
    expect(
      isSkinUnlocked(arcticWolf, { ...defaultStats, highestScore: 1000 })
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

  it("games_played skins unlock at count", () => {
    const timberWolf = SKINS.find((s) => s.id === "timber-wolf")!;
    expect(
      isSkinUnlocked(timberWolf, { ...defaultStats, gamesPlayed: 4 })
    ).toBe(false);
    expect(
      isSkinUnlocked(timberWolf, { ...defaultStats, gamesPlayed: 5 })
    ).toBe(true);
  });

  it("achievement-based skins unlock when achievement is earned", () => {
    const frostWolf = SKINS.find((s) => s.id === "frost-wolf")!;
    expect(isSkinUnlocked(frostWolf, defaultStats)).toBe(false);
    expect(
      isSkinUnlocked(frostWolf, {
        ...defaultStats,
        achievementIds: new Set(["marathon-runner"]),
      })
    ).toBe(true);
  });

  it("alpha-wolf unlocks with champion achievement", () => {
    const alphaWolf = SKINS.find((s) => s.id === "alpha-wolf")!;
    expect(
      isSkinUnlocked(alphaWolf, {
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
