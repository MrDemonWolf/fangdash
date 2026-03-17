import { describe, expect, it, beforeEach } from "vitest";
import {
	createTestDb,
	createTestUser,
	createTestPlayer,
	createTestScore,
	type TestDb,
} from "../helpers/test-db.ts";
import { createTestCaller } from "../helpers/test-caller.ts";
import { SCORE_PER_SECOND, SCORE_PER_OBSTACLE, MOD_FOG, MOD_HEADWIND } from "@fangdash/shared";

describe("score router", () => {
	let db: TestDb;

	beforeEach(() => {
		({ db } = createTestDb());
	});

	describe("submit", () => {
		it("should submit a valid score", async () => {
			const userId = createTestUser(db);
			createTestPlayer(db, userId);
			const caller = createTestCaller({ db, userId });

			const result = await caller.score.submit({
				score: 100,
				distance: 500,
				obstaclesCleared: 5,
				longestCleanRun: 200,
				duration: 30000,
				seed: "test-seed",
				difficulty: "easy",
			});

			expect(result.scoreId).toBeDefined();
			expect(result.xpGained).toBe(100);
		});

		it("should reject scores exceeding anti-cheat threshold", async () => {
			const userId = createTestUser(db);
			createTestPlayer(db, userId);
			const caller = createTestCaller({ db, userId });

			const duration = 10000;
			const obstaclesCleared = 2;
			const maxAllowed =
				(duration / 1000) * SCORE_PER_SECOND + obstaclesCleared * SCORE_PER_OBSTACLE;
			const cheatedScore = Math.ceil(maxAllowed * 1.5);

			await expect(
				caller.score.submit({
					score: cheatedScore,
					distance: 500,
					obstaclesCleared,
					longestCleanRun: 0,
					duration,
					seed: "test-seed",
					difficulty: "easy",
				}),
			).rejects.toThrow("Score exceeds maximum allowed rate");
		});

		it("should reject game sessions exceeding max duration", async () => {
			const userId = createTestUser(db);
			createTestPlayer(db, userId);
			const caller = createTestCaller({ db, userId });

			await expect(
				caller.score.submit({
					score: 100,
					distance: 500,
					obstaclesCleared: 5,
					longestCleanRun: 0,
					duration: 2_000_000,
					seed: "test-seed",
					difficulty: "easy",
				}),
			).rejects.toThrow("Game session exceeds maximum allowed duration");
		});

		it("should block banned users", async () => {
			const userId = createTestUser(db, { banned: true, banReason: "cheating" });
			createTestPlayer(db, userId);
			const caller = createTestCaller({
				db,
				userId,
				banned: true,
				banReason: "cheating",
			});

			await expect(
				caller.score.submit({
					score: 100,
					distance: 500,
					obstaclesCleared: 5,
					longestCleanRun: 0,
					duration: 30000,
					seed: "test-seed",
					difficulty: "easy",
				}),
			).rejects.toThrow("banned");
		});

		it("should allow expired bans", async () => {
			const expiredDate = new Date(Date.now() - 86400000);
			const userId = createTestUser(db, { banned: true, banExpires: expiredDate });
			createTestPlayer(db, userId);
			const caller = createTestCaller({
				db,
				userId,
				banned: true,
				banExpires: expiredDate,
			});

			const result = await caller.score.submit({
				score: 100,
				distance: 500,
				obstaclesCleared: 5,
				longestCleanRun: 0,
				duration: 30000,
				seed: "test-seed",
				difficulty: "easy",
			});

			expect(result.scoreId).toBeDefined();
		});

		it("should accept score at exact anti-cheat boundary", async () => {
			const userId = createTestUser(db);
			createTestPlayer(db, userId);
			const caller = createTestCaller({ db, userId });

			const duration = 10000;
			const obstaclesCleared = 2;
			const maxAllowed =
				(duration / 1000) * SCORE_PER_SECOND + obstaclesCleared * SCORE_PER_OBSTACLE;
			const borderlineScore = Math.floor(maxAllowed * 1.05 + 10);

			const result = await caller.score.submit({
				score: borderlineScore,
				distance: 500,
				obstaclesCleared,
				longestCleanRun: 0,
				duration,
				seed: "test-seed",
				difficulty: "easy",
			});

			expect(result.scoreId).toBeDefined();
		});

		it("should create player record if not existing", async () => {
			const userId = createTestUser(db);
			const caller = createTestCaller({ db, userId });

			const result = await caller.score.submit({
				score: 50,
				distance: 100,
				obstaclesCleared: 1,
				longestCleanRun: 0,
				duration: 5000,
				seed: "test-seed",
				difficulty: "easy",
			});

			expect(result.scoreId).toBeDefined();
		});

		it("should track XP gained", async () => {
			const userId = createTestUser(db);
			createTestPlayer(db, userId, { totalXp: 0, level: 1 });
			const caller = createTestCaller({ db, userId });

			const result = await caller.score.submit({
				score: 1000,
				distance: 5000,
				obstaclesCleared: 50,
				longestCleanRun: 500,
				duration: 60000,
				seed: "test-seed",
				difficulty: "easy",
			});

			expect(result.xpGained).toBe(1000);
		});

		it("should require authentication", async () => {
			const caller = createTestCaller({ db });

			await expect(
				caller.score.submit({
					score: 100,
					distance: 500,
					obstaclesCleared: 5,
					longestCleanRun: 0,
					duration: 30000,
					seed: "test-seed",
					difficulty: "easy",
				}),
			).rejects.toThrow("UNAUTHORIZED");
		});

		it("should default difficulty to easy", async () => {
			const userId = createTestUser(db);
			createTestPlayer(db, userId);
			const caller = createTestCaller({ db, userId });

			const result = await caller.score.submit({
				score: 50,
				distance: 100,
				obstaclesCleared: 1,
				longestCleanRun: 0,
				duration: 5000,
				seed: "test-seed",
			});

			expect(result.scoreId).toBeDefined();
		});

		it("should reject negative score", async () => {
			const userId = createTestUser(db);
			createTestPlayer(db, userId);
			const caller = createTestCaller({ db, userId });

			await expect(
				caller.score.submit({
					score: -1,
					distance: 500,
					obstaclesCleared: 5,
					longestCleanRun: 0,
					duration: 30000,
					seed: "test-seed",
					difficulty: "easy",
				}),
			).rejects.toThrow();
		});

		it("should reject empty seed", async () => {
			const userId = createTestUser(db);
			createTestPlayer(db, userId);
			const caller = createTestCaller({ db, userId });

			await expect(
				caller.score.submit({
					score: 100,
					distance: 500,
					obstaclesCleared: 5,
					longestCleanRun: 0,
					duration: 30000,
					seed: "",
					difficulty: "easy",
				}),
			).rejects.toThrow();
		});

		it("should accept short game score within flat buffer", async () => {
			const userId = createTestUser(db);
			createTestPlayer(db, userId);
			const caller = createTestCaller({ db, userId });

			// 3-sec game: maxAllowed = 3 * SCORE_PER_SECOND + 0 * SCORE_PER_OBSTACLE
			// With tolerance: maxAllowed * 1.05 + 10 gives enough room
			const result = await caller.score.submit({
				score: 39,
				distance: 100,
				obstaclesCleared: 0,
				longestCleanRun: 0,
				duration: 3000,
				seed: "short-game",
				difficulty: "easy",
			});

			expect(result.scoreId).toBeDefined();
		});

		it("should reject score just over tolerance", async () => {
			const userId = createTestUser(db);
			createTestPlayer(db, userId);
			const caller = createTestCaller({ db, userId });

			const duration = 10000;
			const obstaclesCleared = 2;
			const maxAllowed =
				(duration / 1000) * SCORE_PER_SECOND + obstaclesCleared * SCORE_PER_OBSTACLE;
			const overScore = Math.ceil(maxAllowed * 1.05 + 10) + 1;

			await expect(
				caller.score.submit({
					score: overScore,
					distance: 500,
					obstaclesCleared,
					longestCleanRun: 0,
					duration,
					seed: "test-seed",
					difficulty: "easy",
				}),
			).rejects.toThrow("Score exceeds maximum allowed rate");
		});

		it("should update player stats after submission", async () => {
			const userId = createTestUser(db);
			createTestPlayer(db, userId, { gamesPlayed: 0, totalScore: 0, totalXp: 0 });
			const caller = createTestCaller({ db, userId });

			await caller.score.submit({
				score: 150,
				distance: 800,
				obstaclesCleared: 10,
				longestCleanRun: 300,
				duration: 30000,
				seed: "stats-test",
				difficulty: "easy",
			});

			const stats = await caller.score.getPlayerStats();
			expect(stats).toBeTruthy();
			expect(stats?.gamesPlayed).toBe(1);
			expect(stats?.totalScore).toBe(150);
			expect(stats?.totalXp).toBe(150);
		});
	});

	describe("leaderboard", () => {
		it("should return empty leaderboard when no scores", async () => {
			const caller = createTestCaller({ db });
			const result = await caller.score.leaderboard();
			expect(result).toEqual([]);
		});

		it("should accept period filter", async () => {
			const caller = createTestCaller({ db });
			const result = await caller.score.leaderboard({ period: "daily" });
			expect(result).toEqual([]);
		});

		it("should accept limit parameter", async () => {
			const caller = createTestCaller({ db });
			const result = await caller.score.leaderboard({ limit: 10 });
			expect(result).toEqual([]);
		});

		it("should return scores in rank order", async () => {
			const caller = createTestCaller({ db });

			const user1 = createTestUser(db, { name: "Player1" });
			const player1 = createTestPlayer(db, user1);
			createTestScore(db, player1, { score: 500 });

			const user2 = createTestUser(db, { name: "Player2" });
			const player2 = createTestPlayer(db, user2);
			createTestScore(db, player2, { score: 1000 });

			const user3 = createTestUser(db, { name: "Player3" });
			const player3 = createTestPlayer(db, user3);
			createTestScore(db, player3, { score: 750 });

			const result = await caller.score.leaderboard();
			expect(result).toHaveLength(3);
			expect(result[0]?.rank).toBe(1);
			expect(result[0]?.score).toBe(1000);
			expect(result[1]?.rank).toBe(2);
			expect(result[1]?.score).toBe(750);
			expect(result[2]?.rank).toBe(3);
			expect(result[2]?.score).toBe(500);
		});

		it("should filter by daily period", async () => {
			const caller = createTestCaller({ db });

			const userId = createTestUser(db);
			const playerId = createTestPlayer(db, userId);

			// Score from 2 days ago — outside daily window
			const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
			createTestScore(db, playerId, { score: 999, createdAt: twoDaysAgo });

			const result = await caller.score.leaderboard({ period: "daily" });
			expect(result).toHaveLength(0);

			// Score from 1 hour ago — inside daily window
			const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
			const user2 = createTestUser(db);
			const player2 = createTestPlayer(db, user2);
			createTestScore(db, player2, { score: 200, createdAt: oneHourAgo });

			const result2 = await caller.score.leaderboard({ period: "daily" });
			expect(result2).toHaveLength(1);
			expect(result2[0]?.score).toBe(200);
		});

		it("should filter by ready mod correctly", async () => {
			const caller = createTestCaller({ db });

			const user1 = createTestUser(db, { name: "FogPlayer" });
			const player1 = createTestPlayer(db, user1);
			createTestScore(db, player1, { score: 600, mods: MOD_FOG });

			const user2 = createTestUser(db, { name: "WindPlayer" });
			const player2 = createTestPlayer(db, user2);
			createTestScore(db, player2, { score: 400, mods: MOD_HEADWIND });

			const result = await caller.score.leaderboard({ mods: MOD_FOG });
			expect(result).toHaveLength(1);
			expect(result[0]?.score).toBe(600);
		});

		it("should filter by difficulty", async () => {
			const caller = createTestCaller({ db });

			const user1 = createTestUser(db);
			const player1 = createTestPlayer(db, user1);
			createTestScore(db, player1, { score: 500, difficulty: "easy" });

			const user2 = createTestUser(db);
			const player2 = createTestPlayer(db, user2);
			createTestScore(db, player2, { score: 300, difficulty: "hard" });

			const easyResults = await caller.score.leaderboard({ difficulty: "easy" });
			expect(easyResults).toHaveLength(1);
			expect(easyResults[0]?.score).toBe(500);

			const hardResults = await caller.score.leaderboard({ difficulty: "hard" });
			expect(hardResults).toHaveLength(1);
			expect(hardResults[0]?.score).toBe(300);
		});
	});

	describe("getPlayerStats", () => {
		it("should return player stats", async () => {
			const userId = createTestUser(db);
			createTestPlayer(db, userId, { gamesPlayed: 5, totalScore: 1000 });
			const caller = createTestCaller({ db, userId });

			const result = await caller.score.getPlayerStats();
			expect(result).toBeTruthy();
			expect(result?.gamesPlayed).toBe(5);
			expect(result?.totalScore).toBe(1000);
		});

		it("should require authentication", async () => {
			const caller = createTestCaller({ db });
			await expect(caller.score.getPlayerStats()).rejects.toThrow("UNAUTHORIZED");
		});
	});

	describe("getGlobalStats", () => {
		it("should return zero stats when no players", async () => {
			const caller = createTestCaller({ db });
			const result = await caller.score.getGlobalStats();
			expect(result.totalPlayers).toBe(0);
			expect(result.totalMeters).toBe(0);
		});
	});
});
