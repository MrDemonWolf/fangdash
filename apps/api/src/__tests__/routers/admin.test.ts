import { describe, expect, it, beforeEach } from "vitest";
import { createTestDb, createTestUser, createTestPlayer, type TestDb } from "../helpers/test-db.ts";
import { createTestCaller } from "../helpers/test-caller.ts";

describe("admin router", () => {
	let db: TestDb;

	beforeEach(() => {
		({ db } = createTestDb());
	});

	describe("getStats", () => {
		it("should return stats for admin", async () => {
			const userId = createTestUser(db, { role: "admin" });
			createTestPlayer(db, userId);
			const caller = createTestCaller({ db, userId, userRole: "admin" });

			const result = await caller.admin.getStats();
			expect(result).toHaveProperty("totalPlayers");
			expect(result).toHaveProperty("totalGamesPlayed");
			expect(result).toHaveProperty("totalMeters");
			expect(result).toHaveProperty("distinctRaces");
			expect(result).toHaveProperty("totalRaceEntries");
		});

		it("should reject non-admin users", async () => {
			const userId = createTestUser(db);
			createTestPlayer(db, userId);
			const caller = createTestCaller({ db, userId, userRole: "user" });

			await expect(caller.admin.getStats()).rejects.toThrow("Admin access required");
		});

		it("should reject unauthenticated users", async () => {
			const caller = createTestCaller({ db });
			await expect(caller.admin.getStats()).rejects.toThrow("UNAUTHORIZED");
		});
	});

	describe("getPlayers", () => {
		it("should return paginated player list", async () => {
			const adminId = createTestUser(db, { role: "admin", name: "Admin" });
			createTestPlayer(db, adminId);
			const user1 = createTestUser(db, { name: "Player1" });
			createTestPlayer(db, user1);
			const user2 = createTestUser(db, { name: "Player2" });
			createTestPlayer(db, user2);

			const caller = createTestCaller({ db, userId: adminId, userRole: "admin" });
			const result = await caller.admin.getPlayers({ limit: 10, page: 1 });

			expect(result.items.length).toBe(3);
			expect(result.total).toBe(3);
		});

		it("should support search filter", async () => {
			const adminId = createTestUser(db, { role: "admin", name: "Admin" });
			createTestPlayer(db, adminId);
			const user1 = createTestUser(db, { name: "SpecialPlayer" });
			createTestPlayer(db, user1);

			const caller = createTestCaller({ db, userId: adminId, userRole: "admin" });
			const result = await caller.admin.getPlayers({ limit: 10, page: 1, search: "Special" });

			expect(result.items.length).toBe(1);
			expect(result.items[0]!.name).toBe("SpecialPlayer");
		});

		it("should reject non-admin", async () => {
			const userId = createTestUser(db);
			const caller = createTestCaller({ db, userId, userRole: "user" });
			await expect(caller.admin.getPlayers({ limit: 10, page: 1 })).rejects.toThrow();
		});
	});

	describe("banUser", () => {
		it("should require auth to be configured", async () => {
			const adminId = createTestUser(db, { role: "admin" });
			createTestPlayer(db, adminId);
			const targetUser = createTestUser(db, { name: "BadUser" });

			// Auth is null in test context, so ban should throw PRECONDITION_FAILED
			const caller = createTestCaller({ db, userId: adminId, userRole: "admin" });
			await expect(
				caller.admin.banUser({ userId: targetUser, reason: "cheating" }),
			).rejects.toThrow("Auth not configured");
		});

		it("should reject non-admin", async () => {
			const userId = createTestUser(db);
			const targetUser = createTestUser(db);
			const caller = createTestCaller({ db, userId, userRole: "user" });

			await expect(caller.admin.banUser({ userId: targetUser, reason: "test" })).rejects.toThrow(
				"Admin access required",
			);
		});
	});

	describe("unbanUser", () => {
		it("should require auth to be configured", async () => {
			const adminId = createTestUser(db, { role: "admin" });
			createTestPlayer(db, adminId);
			const targetUser = createTestUser(db, { banned: true, banReason: "test" });

			const caller = createTestCaller({ db, userId: adminId, userRole: "admin" });
			await expect(caller.admin.unbanUser({ userId: targetUser })).rejects.toThrow(
				"Auth not configured",
			);
		});

		it("should reject non-admin", async () => {
			const userId = createTestUser(db);
			const targetUser = createTestUser(db);
			const caller = createTestCaller({ db, userId, userRole: "user" });

			await expect(caller.admin.unbanUser({ userId: targetUser })).rejects.toThrow(
				"Admin access required",
			);
		});
	});

	describe("getScores", () => {
		it("should return empty scores for admin", async () => {
			const adminId = createTestUser(db, { role: "admin" });
			createTestPlayer(db, adminId);
			const caller = createTestCaller({ db, userId: adminId, userRole: "admin" });

			const result = await caller.admin.getScores({ limit: 10, page: 1 });
			expect(result).toHaveProperty("items");
			expect(result).toHaveProperty("total");
			expect(result.items).toEqual([]);
		});
	});

	describe("deleteScore", () => {
		it("should reject non-admin", async () => {
			const userId = createTestUser(db);
			const caller = createTestCaller({ db, userId, userRole: "user" });
			await expect(caller.admin.deleteScore({ scoreId: "fake" })).rejects.toThrow(
				"Admin access required",
			);
		});

		it("should throw NOT_FOUND for missing score", async () => {
			const adminId = createTestUser(db, { role: "admin" });
			createTestPlayer(db, adminId);
			const caller = createTestCaller({ db, userId: adminId, userRole: "admin" });
			await expect(caller.admin.deleteScore({ scoreId: "nonexistent" })).rejects.toThrow(
				"Score not found",
			);
		});
	});
});
