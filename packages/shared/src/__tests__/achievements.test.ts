// biome-ignore lint/correctness/noUndeclaredDependencies: vitest is a workspace root dependency
import { describe, expect, it } from "vitest";
import {
	ACHIEVEMENTS,
	getAchievementById,
	getAchievementsByCategory,
} from "../achievements.ts";
import { SKINS } from "../skins.ts";

describe("Achievements", () => {
	it("all achievements have unique IDs", () => {
		const ids = ACHIEVEMENTS.map((a) => a.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it("getAchievementById returns correct achievement", () => {
		const achievement = getAchievementById("first-fang");
		expect(achievement).toBeDefined();
		expect(achievement?.name).toBe("First Fang");
	});

	it("getAchievementById returns undefined for unknown ID", () => {
		expect(getAchievementById("nonexistent")).toBeUndefined();
	});

	it("getAchievementsByCategory filters correctly", () => {
		const scoreAchievements = getAchievementsByCategory("score");
		expect(scoreAchievements.length).toBeGreaterThan(0);
		expect(scoreAchievements.every((a) => a.category === "score")).toBe(true);
	});

	it("covers all categories", () => {
		const categories = [
			"score",
			"distance",
			"games",
			"skill",
			"social",
		] as const;
		for (const cat of categories) {
			expect(getAchievementsByCategory(cat).length).toBeGreaterThan(0);
		}
	});

	it("reward skins reference valid skin IDs", () => {
		const skinIds = new Set(SKINS.map((s) => s.id));
		for (const achievement of ACHIEVEMENTS) {
			if (achievement.rewardSkinId) {
				expect(skinIds.has(achievement.rewardSkinId)).toBe(true);
			}
		}
	});
});
