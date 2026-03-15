import { describe, expect, it, beforeEach } from "vitest";
import { createTestDb, createTestUser, createTestPlayer, type TestDb } from "../helpers/test-db.ts";
import { createTestCaller } from "../helpers/test-caller.ts";
import { SCORE_PER_SECOND, SCORE_PER_OBSTACLE } from "@fangdash/shared";

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
			const borderlineScore = Math.floor(maxAllowed * 1.02);

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
	});

	describe("getPlayerStats", () => {
		it("should return player stats", async () => {
			const userId = createTestUser(db);
			createTestPlayer(db, userId, { gamesPlayed: 5, totalScore: 1000 });
			const caller = createTestCaller({ db, userId });

			const result = await caller.score.getPlayerStats();
			expect(result).toBeTruthy();
			expect(result!.gamesPlayed).toBe(5);
			expect(result!.totalScore).toBe(1000);
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
