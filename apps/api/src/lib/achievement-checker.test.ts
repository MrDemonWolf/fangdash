import { describe, expect, it } from "vitest";
import type { AchievementDefinition } from "@fangdash/shared/types";
import { isAchievementEarned, type PlayerStats } from "./achievement-checker.ts";

function makeStats(overrides: Partial<PlayerStats> = {}): PlayerStats {
	return {
		highestScore: 0,
		highestDistance: 0,
		totalScore: 0,
		totalDistance: 0,
		totalObstaclesCleared: 0,
		gamesPlayed: 0,
		racesPlayed: 0,
		racesWon: 0,
		longestCleanRun: 0,
		...overrides,
	};
}

function makeAchievement(condition: AchievementDefinition["condition"]): AchievementDefinition {
	return {
		id: "test",
		name: "Test",
		description: "Test achievement",
		category: "score",
		icon: "trophy",
		condition,
	};
}

describe("isAchievementEarned", () => {
	describe("score_single", () => {
		const achievement = makeAchievement({ type: "score_single", threshold: 1000 });

		it("test_score_single_at_threshold_returns_true", () => {
			expect(isAchievementEarned(achievement, makeStats({ highestScore: 1000 }))).toBe(true);
		});

		it("test_score_single_above_threshold_returns_true", () => {
			expect(isAchievementEarned(achievement, makeStats({ highestScore: 1500 }))).toBe(true);
		});

		it("test_score_single_below_threshold_returns_false", () => {
			expect(isAchievementEarned(achievement, makeStats({ highestScore: 999 }))).toBe(false);
		});

		it("test_score_single_zero_returns_false", () => {
			expect(isAchievementEarned(achievement, makeStats())).toBe(false);
		});
	});

	describe("score_total", () => {
		const achievement = makeAchievement({ type: "score_total", threshold: 5000 });

		it("test_score_total_at_threshold_returns_true", () => {
			expect(isAchievementEarned(achievement, makeStats({ totalScore: 5000 }))).toBe(true);
		});

		it("test_score_total_below_threshold_returns_false", () => {
			expect(isAchievementEarned(achievement, makeStats({ totalScore: 4999 }))).toBe(false);
		});
	});

	describe("distance_single", () => {
		const achievement = makeAchievement({ type: "distance_single", threshold: 5000 });

		it("test_distance_single_at_threshold_returns_true", () => {
			expect(isAchievementEarned(achievement, makeStats({ highestDistance: 5000 }))).toBe(true);
		});

		it("test_distance_single_below_threshold_returns_false", () => {
			expect(isAchievementEarned(achievement, makeStats({ highestDistance: 4999 }))).toBe(false);
		});
	});

	describe("distance_total", () => {
		const achievement = makeAchievement({ type: "distance_total", threshold: 10000 });

		it("test_distance_total_at_threshold_returns_true", () => {
			expect(isAchievementEarned(achievement, makeStats({ totalDistance: 10000 }))).toBe(true);
		});

		it("test_distance_total_below_threshold_returns_false", () => {
			expect(isAchievementEarned(achievement, makeStats({ totalDistance: 9999 }))).toBe(false);
		});
	});

	describe("games_played", () => {
		const achievement = makeAchievement({ type: "games_played", count: 10 });

		it("test_games_played_at_count_returns_true", () => {
			expect(isAchievementEarned(achievement, makeStats({ gamesPlayed: 10 }))).toBe(true);
		});

		it("test_games_played_below_count_returns_false", () => {
			expect(isAchievementEarned(achievement, makeStats({ gamesPlayed: 9 }))).toBe(false);
		});
	});

	describe("obstacles_cleared", () => {
		const achievement = makeAchievement({ type: "obstacles_cleared", count: 1000 });

		it("test_obstacles_cleared_at_count_returns_true", () => {
			expect(isAchievementEarned(achievement, makeStats({ totalObstaclesCleared: 1000 }))).toBe(
				true,
			);
		});

		it("test_obstacles_cleared_below_count_returns_false", () => {
			expect(isAchievementEarned(achievement, makeStats({ totalObstaclesCleared: 999 }))).toBe(
				false,
			);
		});
	});

	describe("races_won", () => {
		const achievement = makeAchievement({ type: "races_won", count: 5 });

		it("test_races_won_at_count_returns_true", () => {
			expect(isAchievementEarned(achievement, makeStats({ racesWon: 5 }))).toBe(true);
		});

		it("test_races_won_below_count_returns_false", () => {
			expect(isAchievementEarned(achievement, makeStats({ racesWon: 4 }))).toBe(false);
		});
	});

	describe("races_played", () => {
		const achievement = makeAchievement({ type: "races_played", count: 3 });

		it("test_races_played_at_count_returns_true", () => {
			expect(isAchievementEarned(achievement, makeStats({ racesPlayed: 3 }))).toBe(true);
		});

		it("test_races_played_below_count_returns_false", () => {
			expect(isAchievementEarned(achievement, makeStats({ racesPlayed: 2 }))).toBe(false);
		});
	});

	describe("perfect_run", () => {
		const achievement = makeAchievement({ type: "perfect_run", distance: 1000 });

		it("test_perfect_run_at_distance_returns_true", () => {
			expect(isAchievementEarned(achievement, makeStats({ longestCleanRun: 1000 }))).toBe(true);
		});

		it("test_perfect_run_below_distance_returns_false", () => {
			expect(isAchievementEarned(achievement, makeStats({ longestCleanRun: 999 }))).toBe(false);
		});

		it("test_perfect_run_zero_returns_false", () => {
			expect(isAchievementEarned(achievement, makeStats())).toBe(false);
		});
	});
});
