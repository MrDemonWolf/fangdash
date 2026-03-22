import { describe, expect, it } from "vitest";
import { totalXpForLevel, getXpForLevel, getPlacementBonus, getLevelFromXp } from "../levels.ts";

describe("levels", () => {
	describe("totalXpForLevel", () => {
		it("returns 0 for level 1", () => {
			expect(totalXpForLevel(1)).toBe(0);
		});

		it("returns 0 for level 0 (below minimum)", () => {
			expect(totalXpForLevel(0)).toBe(0);
		});

		it("returns correct XP for level 2", () => {
			// 5 * (2-1)^3 = 5
			expect(totalXpForLevel(2)).toBe(5);
		});

		it("returns correct XP for level 3", () => {
			// 5 * (3-1)^3 = 5 * 8 = 40
			expect(totalXpForLevel(3)).toBe(40);
		});

		it("increases with level", () => {
			for (let i = 2; i <= 10; i++) {
				expect(totalXpForLevel(i)).toBeGreaterThan(totalXpForLevel(i - 1));
			}
		});
	});

	describe("getXpForLevel", () => {
		it("returns 0 for level 1", () => {
			expect(getXpForLevel(1)).toBe(0);
		});

		it("returns the difference between cumulative XP", () => {
			expect(getXpForLevel(2)).toBe(totalXpForLevel(2) - totalXpForLevel(1));
			expect(getXpForLevel(3)).toBe(totalXpForLevel(3) - totalXpForLevel(2));
		});

		it("increases for higher levels (cubic growth)", () => {
			expect(getXpForLevel(5)).toBeGreaterThan(getXpForLevel(4));
			expect(getXpForLevel(10)).toBeGreaterThan(getXpForLevel(5));
		});
	});

	describe("getPlacementBonus", () => {
		it("returns 500 for 1st place", () => {
			expect(getPlacementBonus(1)).toBe(500);
		});

		it("returns 250 for 2nd place", () => {
			expect(getPlacementBonus(2)).toBe(250);
		});

		it("returns 100 for 3rd place", () => {
			expect(getPlacementBonus(3)).toBe(100);
		});

		it("returns 0 for 4th and beyond", () => {
			expect(getPlacementBonus(4)).toBe(0);
			expect(getPlacementBonus(10)).toBe(0);
			expect(getPlacementBonus(100)).toBe(0);
		});
	});

	describe("getLevelFromXp", () => {
		it("returns level 1 for 0 XP", () => {
			const info = getLevelFromXp(0);
			expect(info.level).toBe(1);
			expect(info.currentXp).toBe(0);
			expect(info.progress).toBe(0);
		});

		it("returns level 1 for negative XP", () => {
			const info = getLevelFromXp(-100);
			expect(info.level).toBe(1);
		});

		it("returns level 1 for NaN", () => {
			const info = getLevelFromXp(NaN);
			expect(info.level).toBe(1);
		});

		it("returns level 1 for Infinity", () => {
			const info = getLevelFromXp(Infinity);
			expect(info.level).toBe(1);
		});

		it("returns level 2 when XP equals totalXpForLevel(2)", () => {
			const info = getLevelFromXp(totalXpForLevel(2));
			expect(info.level).toBe(2);
		});

		it("returns correct progress within a level", () => {
			const xpForLevel2 = totalXpForLevel(2);
			const xpForLevel3 = totalXpForLevel(3);
			const midXp = Math.floor((xpForLevel2 + xpForLevel3) / 2);
			const info = getLevelFromXp(midXp);
			expect(info.level).toBe(2);
			expect(info.progress).toBeGreaterThan(0);
			expect(info.progress).toBeLessThan(1);
		});

		it("calculates correct level for large XP values", () => {
			const level10Xp = totalXpForLevel(10);
			const info = getLevelFromXp(level10Xp);
			expect(info.level).toBe(10);
		});

		it("xpForCurrentLevel + xpForNextLevel span the level correctly", () => {
			const info = getLevelFromXp(50);
			expect(info.xpForCurrentLevel).toBeGreaterThanOrEqual(0);
			expect(info.xpForNextLevel).toBeGreaterThan(0);
			expect(info.progress).toBeCloseTo(info.xpForCurrentLevel / info.xpForNextLevel);
		});
	});
});
