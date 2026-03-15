import { describe, expect, it, beforeEach } from "vitest";
import { createTestDb, createTestUser, createTestPlayer, type TestDb } from "../helpers/test-db.ts";
import { createTestCaller } from "../helpers/test-caller.ts";
import { ACHIEVEMENTS } from "@fangdash/shared";

describe("achievement router", () => {
	let db: TestDb;

	beforeEach(() => {
		({ db } = createTestDb());
	});

	describe("getAll", () => {
		it("should return all achievements with unlock status", async () => {
			const userId = createTestUser(db);
			createTestPlayer(db, userId);
			const caller = createTestCaller({ db, userId });

			const result = await caller.achievement.getAll();
			expect(result.length).toBe(ACHIEVEMENTS.length);
			expect(result[0]).toHaveProperty("unlocked");
		});

		it("should show unlocked achievements as unlocked", async () => {
			const userId = createTestUser(db);
			const playerId = createTestPlayer(db, userId);
			const caller = createTestCaller({ db, userId });

			// Manually unlock an achievement
			const { playerAchievement } = await import("../../db/schema.ts");
			db.insert(playerAchievement)
				.values({
					id: crypto.randomUUID(),
					playerId,
					achievementId: ACHIEVEMENTS[0]!.id,
					unlockedAt: new Date(),
				})
				.run();

			const result = await caller.achievement.getAll();
			const first = result.find((a) => a.id === ACHIEVEMENTS[0]!.id);
			expect(first?.unlocked).toBe(true);
		});

		it("should require authentication", async () => {
			const caller = createTestCaller({ db });
			await expect(caller.achievement.getAll()).rejects.toThrow("UNAUTHORIZED");
		});
	});

	describe("getMine", () => {
		it("should return empty array for new player", async () => {
			const userId = createTestUser(db);
			createTestPlayer(db, userId);
			const caller = createTestCaller({ db, userId });

			const result = await caller.achievement.getMine();
			expect(result).toEqual([]);
		});

		it("should require authentication", async () => {
			const caller = createTestCaller({ db });
			await expect(caller.achievement.getMine()).rejects.toThrow("UNAUTHORIZED");
		});
	});

	describe("list", () => {
		it("should return all achievement definitions publicly", async () => {
			const caller = createTestCaller({ db });
			const result = await caller.achievement.list();
			expect(result.length).toBe(ACHIEVEMENTS.length);
			expect(result[0]).toHaveProperty("id");
			expect(result[0]).toHaveProperty("name");
		});
	});
});
