import { verifyRaceToken } from "@fangdash/shared";
import { describe, expect, it, beforeEach } from "vitest";
import { createTestDb, createTestUser, createTestPlayer, type TestDb } from "../helpers/test-db.ts";
import { createTestCaller } from "../helpers/test-caller.ts";
import { MAX_DURATION_MS, MAX_SCORE_ABSOLUTE } from "@fangdash/shared";

describe("race router", () => {
	let db: TestDb;

	beforeEach(() => {
		({ db } = createTestDb());
	});

	describe("getConnectionToken", () => {
		it("mints a token that verifies back to the user id", async () => {
			const userId = createTestUser(db);
			const caller = createTestCaller({ db, userId, raceTokenSecret: "secret-a" });

			const { token, expiresIn } = await caller.race.getConnectionToken();

			expect(expiresIn).toBeGreaterThan(0);
			expect(await verifyRaceToken(token, "secret-a")).toEqual({ userId });
			// Wrong secret must not verify
			expect(await verifyRaceToken(token, "secret-b")).toBeNull();
		});

		it("throws when RACE_TOKEN_SECRET is not configured", async () => {
			const userId = createTestUser(db);
			const caller = createTestCaller({ db, userId, raceTokenSecret: null });

			await expect(caller.race.getConnectionToken()).rejects.toThrow(/RACE_TOKEN_SECRET/);
		});

		it("rejects unauthenticated callers", async () => {
			const caller = createTestCaller({ db });
			await expect(caller.race.getConnectionToken()).rejects.toThrow();
		});
	});

	describe("submitResult", () => {
		it("should submit a valid race result", async () => {
			const userId = createTestUser(db);
			createTestPlayer(db, userId);
			const caller = createTestCaller({ db, userId });

			const result = await caller.race.submitResult({
				raceId: "race-1",
				score: 500,
				distance: 1000,
				duration: 60000,
				obstaclesCleared: 5,
				seed: "test-seed",
			});

			expect(result.raceHistoryId).toBeDefined();
			expect(result.placement).toBe(1);
			expect(result.xpGained).toBeGreaterThan(0);
		});

		it("should compute correct placement with multiple players", async () => {
			const user1 = createTestUser(db);
			createTestPlayer(db, user1);
			const user2 = createTestUser(db);
			createTestPlayer(db, user2);

			const caller1 = createTestCaller({ db, userId: user1 });
			const caller2 = createTestCaller({ db, userId: user2 });

			await caller1.race.submitResult({
				raceId: "race-1",
				score: 300,
				distance: 600,
				duration: 60000,
				obstaclesCleared: 3,
				seed: "test-seed",
			});

			const result2 = await caller2.race.submitResult({
				raceId: "race-1",
				score: 500,
				distance: 1000,
				duration: 60000,
				obstaclesCleared: 5,
				seed: "test-seed",
			});

			expect(result2.placement).toBe(1);
		});

		it("should reject a second result for the same race from the same player", async () => {
			const userId = createTestUser(db);
			createTestPlayer(db, userId);
			const caller = createTestCaller({ db, userId });

			await caller.race.submitResult({
				raceId: "race-1",
				score: 500,
				distance: 1000,
				duration: 60000,
				obstaclesCleared: 5,
				seed: "test-seed",
			});

			await expect(
				caller.race.submitResult({
					raceId: "race-1",
					score: 600,
					distance: 1200,
					duration: 60000,
					obstaclesCleared: 6,
					seed: "test-seed",
				}),
			).rejects.toThrow("Result for this race was already submitted");
		});

		it("should reject scores exceeding the anti-cheat rate", async () => {
			const userId = createTestUser(db);
			createTestPlayer(db, userId);
			const caller = createTestCaller({ db, userId });

			await expect(
				caller.race.submitResult({
					raceId: "race-1",
					score: 999_999,
					distance: 500,
					duration: 10000,
					obstaclesCleared: 2,
					seed: "test-seed",
				}),
			).rejects.toThrow("Score exceeds maximum allowed rate");
		});

		it("should reject distance exceeding the maximum possible rate", async () => {
			const userId = createTestUser(db);
			createTestPlayer(db, userId);
			const caller = createTestCaller({ db, userId });

			await expect(
				caller.race.submitResult({
					raceId: "race-1",
					score: 100,
					distance: 10_000,
					duration: 10000,
					obstaclesCleared: 2,
					seed: "test-seed",
				}),
			).rejects.toThrow("Distance exceeds maximum possible rate");
		});

		it("should reject obstacles cleared exceeding the maximum possible rate", async () => {
			const userId = createTestUser(db);
			createTestPlayer(db, userId);
			const caller = createTestCaller({ db, userId });

			await expect(
				caller.race.submitResult({
					raceId: "race-1",
					score: 100,
					distance: 500,
					duration: 10000,
					obstaclesCleared: 100,
					seed: "test-seed",
				}),
			).rejects.toThrow("Obstacles cleared exceeds maximum possible rate");
		});

		it("should reject scores above the absolute cap", async () => {
			const userId = createTestUser(db);
			createTestPlayer(db, userId);
			const caller = createTestCaller({ db, userId });

			await expect(
				caller.race.submitResult({
					raceId: "race-1",
					score: MAX_SCORE_ABSOLUTE + 1,
					distance: 1000,
					duration: 60000,
					obstaclesCleared: 5,
					seed: "test-seed",
				}),
			).rejects.toThrow();
		});

		it("should reject durations above the absolute cap", async () => {
			const userId = createTestUser(db);
			createTestPlayer(db, userId);
			const caller = createTestCaller({ db, userId });

			await expect(
				caller.race.submitResult({
					raceId: "race-1",
					score: 500,
					distance: 1000,
					duration: MAX_DURATION_MS + 1,
					obstaclesCleared: 5,
					seed: "test-seed",
				}),
			).rejects.toThrow();
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
				caller.race.submitResult({
					raceId: "race-1",
					score: 500,
					distance: 1000,
					duration: 60000,
					obstaclesCleared: 5,
					seed: "test-seed",
				}),
			).rejects.toThrow("banned");
		});

		it("should require authentication", async () => {
			const caller = createTestCaller({ db });

			await expect(
				caller.race.submitResult({
					raceId: "race-1",
					score: 500,
					distance: 1000,
					duration: 60000,
					obstaclesCleared: 5,
					seed: "test-seed",
				}),
			).rejects.toThrow("UNAUTHORIZED");
		});

		it("should create player record if not existing", async () => {
			const userId = createTestUser(db);
			const caller = createTestCaller({ db, userId });

			const result = await caller.race.submitResult({
				raceId: "race-1",
				score: 500,
				distance: 1000,
				duration: 60000,
				obstaclesCleared: 5,
				seed: "test-seed",
			});

			expect(result.raceHistoryId).toBeDefined();
		});

		it("should award XP with placement bonus", async () => {
			const userId = createTestUser(db);
			createTestPlayer(db, userId);
			const caller = createTestCaller({ db, userId });

			const result = await caller.race.submitResult({
				raceId: "race-1",
				score: 500,
				distance: 1000,
				duration: 60000,
				obstaclesCleared: 5,
				seed: "test-seed",
			});

			// 1st place bonus + score
			expect(result.xpGained).toBeGreaterThan(500);
		});

		it("should handle zero score", async () => {
			const userId = createTestUser(db);
			createTestPlayer(db, userId);
			const caller = createTestCaller({ db, userId });

			const result = await caller.race.submitResult({
				raceId: "race-1",
				score: 0,
				distance: 0,
				duration: 1000,
				obstaclesCleared: 0,
				seed: "test-seed",
			});

			expect(result.raceHistoryId).toBeDefined();
		});

		it("should track level up", async () => {
			const userId = createTestUser(db);
			createTestPlayer(db, userId, { totalXp: 0, level: 1 });
			const caller = createTestCaller({ db, userId });

			const result = await caller.race.submitResult({
				raceId: "race-1",
				score: 5000,
				distance: 10000,
				duration: 300000,
				obstaclesCleared: 50,
				seed: "test-seed",
			});

			expect(typeof result.levelUp).toBe("boolean");
			expect(typeof result.newLevel).toBe("number");
		});

		it("should rank a later, higher result above earlier ones", async () => {
			const user1 = createTestUser(db);
			createTestPlayer(db, user1);
			const user2 = createTestUser(db);
			createTestPlayer(db, user2);

			const caller1 = createTestCaller({ db, userId: user1 });
			const caller2 = createTestCaller({ db, userId: user2 });

			// User1 submits a high score first, then user2 submits even higher.
			await caller1.race.submitResult({
				raceId: "race-1",
				score: 300,
				distance: 600,
				duration: 60000,
				obstaclesCleared: 3,
				seed: "test-seed",
			});
			const result2 = await caller2.race.submitResult({
				raceId: "race-1",
				score: 500,
				distance: 1000,
				duration: 60000,
				obstaclesCleared: 5,
				seed: "test-seed",
			});

			// The higher score outranks the earlier one.
			expect(result2.placement).toBe(1);
		});

		it("must NOT mutate another player's stats when a foreign result is submitted (anti-grief)", async () => {
			// Regression test for the race-result griefing vector: an authenticated user
			// who submits under a raceId they did not play must not be able to demote a
			// real participant's placement, XP, or races-won.
			const victim = createTestUser(db);
			createTestPlayer(db, victim);
			const griefer = createTestUser(db);
			createTestPlayer(db, griefer);

			const victimCaller = createTestCaller({ db, userId: victim });
			const grieferCaller = createTestCaller({ db, userId: griefer });

			// Victim legitimately wins their race.
			await victimCaller.race.submitResult({
				raceId: "race-1",
				score: 400,
				distance: 800,
				duration: 60000,
				obstaclesCleared: 4,
				seed: "victim-seed",
			});
			const before = await victimCaller.race.getStats();
			const beforeXp = (await victimCaller.score.getPlayerStats()).totalXp;
			expect(before.racesWon).toBe(1);

			// Griefer injects a higher score into the SAME race.
			await grieferCaller.race.submitResult({
				raceId: "race-1",
				score: 900,
				distance: 1800,
				duration: 120000,
				obstaclesCleared: 9,
				seed: "griefer-seed",
			});

			// Victim's stats are untouched — no cross-player writes occurred.
			const after = await victimCaller.race.getStats();
			const afterXp = (await victimCaller.score.getPlayerStats()).totalXp;
			expect(after.racesWon).toBe(before.racesWon);
			expect(afterXp).toBe(beforeXp);
		});

		it("should reject invalid raceId", async () => {
			const userId = createTestUser(db);
			createTestPlayer(db, userId);
			const caller = createTestCaller({ db, userId });

			await expect(
				caller.race.submitResult({
					raceId: "",
					score: 500,
					distance: 1000,
					duration: 60000,
					obstaclesCleared: 5,
					seed: "test-seed",
				}),
			).rejects.toThrow();
		});
	});

	describe("getHistory", () => {
		it("should return empty history for new player", async () => {
			const userId = createTestUser(db);
			createTestPlayer(db, userId);
			const caller = createTestCaller({ db, userId });

			const result = await caller.race.getHistory();
			expect(result).toEqual([]);
		});

		it("should require authentication", async () => {
			const caller = createTestCaller({ db });
			await expect(caller.race.getHistory()).rejects.toThrow("UNAUTHORIZED");
		});
	});

	describe("getStats", () => {
		it("should return race stats", async () => {
			const userId = createTestUser(db);
			createTestPlayer(db, userId, { racesPlayed: 10, racesWon: 3 });
			const caller = createTestCaller({ db, userId });

			const result = await caller.race.getStats();
			expect(result.racesPlayed).toBe(10);
			expect(result.racesWon).toBe(3);
		});
	});
});
