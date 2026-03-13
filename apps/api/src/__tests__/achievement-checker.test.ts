import { ACHIEVEMENTS, getAchievementById } from "@fangdash/shared/achievements";
import { describe, expect, it } from "vitest";
import { isAchievementEarned, type PlayerStats } from "../lib/achievement-checker.ts";

const defaultStats: PlayerStats = {
	highestScore: 0,
	highestDistance: 0,
	totalScore: 0,
	totalDistance: 0,
	totalObstaclesCleared: 0,
	gamesPlayed: 0,
	racesPlayed: 0,
	racesWon: 0,
	longestCleanRun: 0,
};

describe("isAchievementEarned", () => {
	it("grants score_single achievement when highestScore meets threshold", () => {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const achievement = getAchievementById("first-fang")!;
		expect(isAchievementEarned(achievement, { ...defaultStats, highestScore: 99 })).toBe(false);
		expect(isAchievementEarned(achievement, { ...defaultStats, highestScore: 100 })).toBe(true);
		expect(isAchievementEarned(achievement, { ...defaultStats, highestScore: 500 })).toBe(true);
	});

	it("grants score_total achievement when totalScore meets threshold", () => {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const achievement = getAchievementById("score-hoarder")!;
		expect(isAchievementEarned(achievement, { ...defaultStats, totalScore: 49999 })).toBe(false);
		expect(isAchievementEarned(achievement, { ...defaultStats, totalScore: 50000 })).toBe(true);
	});

	it("grants distance_single achievement when highestDistance meets threshold", () => {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const achievement = getAchievementById("first-steps")!;
		expect(
			isAchievementEarned(achievement, {
				...defaultStats,
				highestDistance: 499,
			}),
		).toBe(false);
		expect(
			isAchievementEarned(achievement, {
				...defaultStats,
				highestDistance: 500,
			}),
		).toBe(true);
	});

	it("grants distance_total achievement when totalDistance meets threshold", () => {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const achievement = getAchievementById("world-traveler")!;
		expect(
			isAchievementEarned(achievement, {
				...defaultStats,
				totalDistance: 49999,
			}),
		).toBe(false);
		expect(
			isAchievementEarned(achievement, {
				...defaultStats,
				totalDistance: 50000,
			}),
		).toBe(true);
	});

	it("grants games_played achievement when gamesPlayed meets count", () => {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const achievement = getAchievementById("pup")!;
		expect(isAchievementEarned(achievement, { ...defaultStats, gamesPlayed: 0 })).toBe(false);
		expect(isAchievementEarned(achievement, { ...defaultStats, gamesPlayed: 1 })).toBe(true);
	});

	it("grants obstacles_cleared achievement", () => {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const achievement = getAchievementById("obstacle-dodger")!;
		expect(
			isAchievementEarned(achievement, {
				...defaultStats,
				totalObstaclesCleared: 99,
			}),
		).toBe(false);
		expect(
			isAchievementEarned(achievement, {
				...defaultStats,
				totalObstaclesCleared: 100,
			}),
		).toBe(true);
	});

	it("grants races_won achievement", () => {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const achievement = getAchievementById("champion")!;
		expect(isAchievementEarned(achievement, { ...defaultStats, racesWon: 9 })).toBe(false);
		expect(isAchievementEarned(achievement, { ...defaultStats, racesWon: 10 })).toBe(true);
	});

	it("grants races_played achievement", () => {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const achievement = getAchievementById("first-race")!;
		expect(isAchievementEarned(achievement, { ...defaultStats, racesPlayed: 0 })).toBe(false);
		expect(isAchievementEarned(achievement, { ...defaultStats, racesPlayed: 1 })).toBe(true);
	});

	it("does not grant perfect_run without sufficient longestCleanRun", () => {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const achievement = getAchievementById("perfect-dash")!;
		expect(
			isAchievementEarned(achievement, {
				...defaultStats,
				highestDistance: 99999,
			}),
		).toBe(false);
	});

	it("grants perfect_run achievement when longestCleanRun meets distance", () => {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const achievement = getAchievementById("perfect-dash")!;
		expect(isAchievementEarned(achievement, { ...defaultStats, longestCleanRun: 999 })).toBe(false);
		expect(isAchievementEarned(achievement, { ...defaultStats, longestCleanRun: 1000 })).toBe(true);
	});

	it("every achievement has a valid condition type", () => {
		for (const achievement of ACHIEVEMENTS) {
			const result = isAchievementEarned(achievement, defaultStats);
			expect(typeof result).toBe("boolean");
		}
	});
});
