import { describe, expect, it, beforeEach } from "vitest";
import { createTestDb, createTestUser, createTestPlayer, type TestDb } from "../helpers/test-db.ts";
import { createTestCaller } from "../helpers/test-caller.ts";

describe("skin router", () => {
	let db: TestDb;

	beforeEach(() => {
		({ db } = createTestDb());
	});

	describe("getUnlockedSkins", () => {
		it("should always include default gray-wolf skin", async () => {
			const userId = createTestUser(db);
			createTestPlayer(db, userId);
			const caller = createTestCaller({ db, userId });

			const result = await caller.skin.getUnlockedSkins();
			expect(result).toContain("gray-wolf");
		});

		it("should include additional unlocked skins", async () => {
			const userId = createTestUser(db);
			const playerId = createTestPlayer(db, userId);
			const caller = createTestCaller({ db, userId });

			// Manually unlock a skin
			const { playerSkin } = await import("../../db/schema.ts");
			db.insert(playerSkin)
				.values({
					id: crypto.randomUUID(),
					playerId,
					skinId: "arctic-wolf",
					unlockedAt: new Date(),
				})
				.run();

			const result = await caller.skin.getUnlockedSkins();
			expect(result).toContain("gray-wolf");
			expect(result).toContain("arctic-wolf");
		});

		it("should require authentication", async () => {
			const caller = createTestCaller({ db });
			await expect(caller.skin.getUnlockedSkins()).rejects.toThrow("UNAUTHORIZED");
		});
	});

	describe("equipSkin", () => {
		it("should equip an owned skin", async () => {
			const userId = createTestUser(db);
			createTestPlayer(db, userId);
			const caller = createTestCaller({ db, userId });

			// gray-wolf is always available
			const result = await caller.skin.equipSkin({ skinId: "gray-wolf" });
			expect(result).toBeDefined();
		});

		it("should reject equipping unowned skin", async () => {
			const userId = createTestUser(db);
			createTestPlayer(db, userId);
			const caller = createTestCaller({ db, userId });

			await expect(
				caller.skin.equipSkin({ skinId: "legendary-wolf-that-doesnt-exist" }),
			).rejects.toThrow();
		});

		it("should require authentication", async () => {
			const caller = createTestCaller({ db });
			await expect(caller.skin.equipSkin({ skinId: "gray-wolf" })).rejects.toThrow("UNAUTHORIZED");
		});
	});

	describe("getEquippedSkin", () => {
		it("should return default equipped skin", async () => {
			const userId = createTestUser(db);
			createTestPlayer(db, userId);
			const caller = createTestCaller({ db, userId });

			const result = await caller.skin.getEquippedSkin();
			expect(result).toHaveProperty("skinId", "gray-wolf");
		});

		it("should require authentication", async () => {
			const caller = createTestCaller({ db });
			await expect(caller.skin.getEquippedSkin()).rejects.toThrow("UNAUTHORIZED");
		});
	});

	describe("gallery", () => {
		it("should return all skins with unlock status", async () => {
			const userId = createTestUser(db);
			createTestPlayer(db, userId);
			const caller = createTestCaller({ db, userId });

			const result = await caller.skin.gallery();
			expect(result.length).toBeGreaterThan(0);
			expect(result[0]).toHaveProperty("unlocked");
		});

		it("should show default skin as unlocked", async () => {
			const userId = createTestUser(db);
			createTestPlayer(db, userId);
			const caller = createTestCaller({ db, userId });

			const result = await caller.skin.gallery();
			const grayWolf = result.find((s) => s.id === "gray-wolf");
			expect(grayWolf?.unlocked).toBe(true);
		});
	});
});
