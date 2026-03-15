import { describe, expect, it, beforeEach } from "vitest";
import { createTestDb, createTestUser, createTestPlayer, type TestDb } from "../helpers/test-db.ts";
import { createTestCaller } from "../helpers/test-caller.ts";

describe("race router", () => {
	let db: TestDb;

	beforeEach(() => {
		({ db } = createTestDb());
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
				seed: "test-seed",
			});

			const result2 = await caller2.race.submitResult({
				raceId: "race-1",
				score: 500,
				distance: 1000,
				seed: "test-seed",
			});

			expect(result2.placement).toBe(1);
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
				seed: "test-seed",
			});

			expect(typeof result.levelUp).toBe("boolean");
			expect(typeof result.newLevel).toBe("number");
		});

		it("should adjust bumped players when new result ranks higher", async () => {
			const user1 = createTestUser(db);
			createTestPlayer(db, user1);
			const user2 = createTestUser(db);
			createTestPlayer(db, user2);
			const user3 = createTestUser(db);
			createTestPlayer(db, user3);

			const caller1 = createTestCaller({ db, userId: user1 });
			const caller2 = createTestCaller({ db, userId: user2 });
			const caller3 = createTestCaller({ db, userId: user3 });

			// User1 submits first with low score
			await caller1.race.submitResult({
				raceId: "race-1",
				score: 100,
				distance: 200,
				seed: "test-seed",
			});

			// User2 submits with medium score
			await caller2.race.submitResult({
				raceId: "race-1",
				score: 300,
				distance: 600,
				seed: "test-seed",
			});

			// User3 submits with highest score — should be 1st
			const result3 = await caller3.race.submitResult({
				raceId: "race-1",
				score: 500,
				distance: 1000,
				seed: "test-seed",
			});

			expect(result3.placement).toBe(1);
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
