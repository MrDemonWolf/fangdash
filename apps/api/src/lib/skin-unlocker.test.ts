import { describe, expect, it } from "vitest";
import { SKINS } from "@fangdash/shared/skins";
import type { SkinDefinition } from "@fangdash/shared/types";
import { isSkinUnlocked } from "./skin-unlocker.ts";

interface SkinStats {
	highestScore: number;
	highestDistance: number;
	gamesPlayed: number;
	achievementIds: Set<string>;
}

function makeStats(overrides: Partial<SkinStats> = {}): SkinStats {
	return {
		highestScore: 0,
		highestDistance: 0,
		gamesPlayed: 0,
		achievementIds: new Set(),
		...overrides,
	};
}

function makeSkin(unlockCondition: SkinDefinition["unlockCondition"]): SkinDefinition {
	return {
		id: "test-skin",
		name: "Test Skin",
		description: "A test skin",
		rarity: "common",
		spriteKey: "wolf-test",
		unlockCondition,
	};
}

describe("isSkinUnlocked", () => {
	describe("default", () => {
		const skin = makeSkin({ type: "default" });

		it("test_default_skin_always_returns_true", () => {
			expect(isSkinUnlocked(skin, makeStats())).toBe(true);
		});
	});

	describe("score", () => {
		const skin = makeSkin({ type: "score", threshold: 5000 });

		it("test_score_skin_at_threshold_returns_true", () => {
			expect(isSkinUnlocked(skin, makeStats({ highestScore: 5000 }))).toBe(true);
		});

		it("test_score_skin_above_threshold_returns_true", () => {
			expect(isSkinUnlocked(skin, makeStats({ highestScore: 6000 }))).toBe(true);
		});

		it("test_score_skin_below_threshold_returns_false", () => {
			expect(isSkinUnlocked(skin, makeStats({ highestScore: 4999 }))).toBe(false);
		});

		it("test_score_skin_zero_returns_false", () => {
			expect(isSkinUnlocked(skin, makeStats())).toBe(false);
		});
	});

	describe("distance", () => {
		const skin = makeSkin({ type: "distance", threshold: 2000 });

		it("test_distance_skin_at_threshold_returns_true", () => {
			expect(isSkinUnlocked(skin, makeStats({ highestDistance: 2000 }))).toBe(true);
		});

		it("test_distance_skin_below_threshold_returns_false", () => {
			expect(isSkinUnlocked(skin, makeStats({ highestDistance: 1999 }))).toBe(false);
		});
	});

	describe("games_played", () => {
		const skin = makeSkin({ type: "games_played", count: 50 });

		it("test_games_played_skin_at_count_returns_true", () => {
			expect(isSkinUnlocked(skin, makeStats({ gamesPlayed: 50 }))).toBe(true);
		});

		it("test_games_played_skin_below_count_returns_false", () => {
			expect(isSkinUnlocked(skin, makeStats({ gamesPlayed: 49 }))).toBe(false);
		});
	});

	describe("achievement", () => {
		const skin = makeSkin({ type: "achievement", achievementId: "obstacle-master" });

		it("test_achievement_skin_with_achievement_returns_true", () => {
			expect(
				isSkinUnlocked(skin, makeStats({ achievementIds: new Set(["obstacle-master"]) })),
			).toBe(true);
		});

		it("test_achievement_skin_without_achievement_returns_false", () => {
			expect(isSkinUnlocked(skin, makeStats({ achievementIds: new Set() }))).toBe(false);
		});

		it("test_achievement_skin_with_different_achievement_returns_false", () => {
			expect(
				isSkinUnlocked(skin, makeStats({ achievementIds: new Set(["other-achievement"]) })),
			).toBe(false);
		});
	});

	describe("default skins skipped in insert pipeline", () => {
		it("test_default_skins_exist_in_definitions", () => {
			const defaultSkins = SKINS.filter((s) => s.unlockCondition.type === "default");
			expect(defaultSkins.length).toBeGreaterThan(0);
		});
	});
});
