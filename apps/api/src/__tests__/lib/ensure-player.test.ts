import { describe, expect, it, beforeEach } from "vitest";
import { createTestDb, createTestUser, createTestPlayer, type TestDb } from "../helpers/test-db.ts";
import { ensurePlayer } from "../../lib/ensure-player.ts";

describe("ensurePlayer", () => {
	let db: TestDb;

	beforeEach(() => {
		({ db } = createTestDb());
	});

	it("should return existing player", async () => {
		const userId = createTestUser(db);
		const playerId = createTestPlayer(db, userId, { totalScore: 500 });

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await ensurePlayer(db as any, userId);
		expect(result).toBeTruthy();
		expect(result?.id).toBe(playerId);
		expect(result?.totalScore).toBe(500);
	});

	it("should create new player if not existing", async () => {
		const userId = createTestUser(db);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await ensurePlayer(db as any, userId);
		expect(result).toBeTruthy();
		expect(result?.userId).toBe(userId);
		expect(result?.equippedSkinId).toBe("gray-wolf");
		expect(result?.level).toBe(1);
	});

	it("should set default values for new player", async () => {
		const userId = createTestUser(db);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await ensurePlayer(db as any, userId);
		expect(result?.totalScore).toBe(0);
		expect(result?.totalDistance).toBe(0);
		expect(result?.gamesPlayed).toBe(0);
		expect(result?.totalXp).toBe(0);
	});

	it("should return same player on repeated calls", async () => {
		const userId = createTestUser(db);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result1 = await ensurePlayer(db as any, userId);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result2 = await ensurePlayer(db as any, userId);
		expect(result1).toBeDefined();
		expect(result2).toBeDefined();
		expect(result1?.id).toBeDefined();
		expect(result2?.id).toBeDefined();
		// Safe to compare: both IDs verified as defined above
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		expect(result1!.id).toBe(result2!.id);
	});

	it("should handle unique constraint violation gracefully", async () => {
		const userId = createTestUser(db);
		// Pre-create a player to test the race condition path
		createTestPlayer(db, userId);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await ensurePlayer(db as any, userId);
		expect(result).toBeTruthy();
		expect(result?.userId).toBe(userId);
	});
});
