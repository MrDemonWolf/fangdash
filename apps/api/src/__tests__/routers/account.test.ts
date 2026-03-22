import { beforeEach, describe, expect, it } from "vitest";
import { createTestCaller } from "../helpers/test-caller.ts";
import { createTestDb, createTestPlayer, createTestUser, type TestDb } from "../helpers/test-db.ts";

describe("account router", () => {
	let db: TestDb;

	beforeEach(() => {
		({ db } = createTestDb());
	});

	describe("getAccountStatus", () => {
		it("returns no pending deletion for new user", async () => {
			const userId = createTestUser(db);
			const caller = createTestCaller({ db, userId });
			createTestPlayer(db, userId);

			const result = await caller.account.getAccountStatus();
			expect(result.deletionPending).toBe(false);
			expect(result.deletionRequestedAt).toBeNull();
			expect(result.deletionScheduledFor).toBeNull();
		});
	});

	describe("requestDeletion", () => {
		it("sets deletion timestamps", async () => {
			const userId = createTestUser(db);
			const caller = createTestCaller({ db, userId });
			createTestPlayer(db, userId);

			const result = await caller.account.requestDeletion();
			expect(result.deletionRequestedAt).toBeTypeOf("number");
			expect(result.deletionScheduledFor).toBeTypeOf("number");
			expect(result.deletionScheduledFor).toBeGreaterThan(result.deletionRequestedAt);
		});

		it("schedules deletion 24 hours from now", async () => {
			const userId = createTestUser(db);
			const caller = createTestCaller({ db, userId });
			createTestPlayer(db, userId);

			const before = Math.floor(Date.now() / 1000);
			const result = await caller.account.requestDeletion();
			const after = Math.floor(Date.now() / 1000);

			const expectedDelay = 24 * 60 * 60;
			expect(result.deletionScheduledFor - result.deletionRequestedAt).toBe(expectedDelay);
			expect(result.deletionRequestedAt).toBeGreaterThanOrEqual(before);
			expect(result.deletionRequestedAt).toBeLessThanOrEqual(after);
		});
	});

	describe("cancelDeletion", () => {
		it("clears deletion timestamps", async () => {
			const userId = createTestUser(db);
			const caller = createTestCaller({ db, userId });
			createTestPlayer(db, userId);

			await caller.account.requestDeletion();
			const result = await caller.account.cancelDeletion();
			expect(result.success).toBe(true);

			const status = await caller.account.getAccountStatus();
			expect(status.deletionPending).toBe(false);
			expect(status.deletionRequestedAt).toBeNull();
			expect(status.deletionScheduledFor).toBeNull();
		});
	});

	describe("getPrivacy", () => {
		it("returns public by default", async () => {
			const userId = createTestUser(db);
			const caller = createTestCaller({ db, userId });
			createTestPlayer(db, userId);

			const result = await caller.account.getPrivacy();
			expect(result.profilePublic).toBe(true);
		});
	});

	describe("updatePrivacy", () => {
		it("sets profile to private", async () => {
			const userId = createTestUser(db);
			const caller = createTestCaller({ db, userId });
			createTestPlayer(db, userId);

			const result = await caller.account.updatePrivacy({ profilePublic: false });
			expect(result.profilePublic).toBe(false);

			const check = await caller.account.getPrivacy();
			expect(check.profilePublic).toBe(false);
		});

		it("sets profile back to public", async () => {
			const userId = createTestUser(db);
			const caller = createTestCaller({ db, userId });
			createTestPlayer(db, userId);

			await caller.account.updatePrivacy({ profilePublic: false });
			const result = await caller.account.updatePrivacy({ profilePublic: true });
			expect(result.profilePublic).toBe(true);

			const check = await caller.account.getPrivacy();
			expect(check.profilePublic).toBe(true);
		});
	});

	describe("create-on-first-use", () => {
		it("auto-creates player on getPrivacy when no player exists", async () => {
			const userId = createTestUser(db);
			const caller = createTestCaller({ db, userId });

			const result = await caller.account.getPrivacy();
			expect(result.profilePublic).toBe(true);
		});

		it("auto-creates player on updatePrivacy when no player exists", async () => {
			const userId = createTestUser(db);
			const caller = createTestCaller({ db, userId });

			const result = await caller.account.updatePrivacy({ profilePublic: false });
			expect(result.profilePublic).toBe(false);

			const check = await caller.account.getPrivacy();
			expect(check.profilePublic).toBe(false);
		});
	});

	describe("unauthenticated", () => {
		it("rejects unauthenticated access", async () => {
			createTestUser(db);
			const caller = createTestCaller({ db });

			await expect(caller.account.getAccountStatus()).rejects.toThrow("UNAUTHORIZED");
		});

		it("rejects banned user with truthy non-boolean ban fields without 500", async () => {
			const userId = createTestUser(db, { banned: true, banExpires: null });
			const caller = createTestCaller({ db, userId, banned: true, banExpires: null });

			await expect(caller.account.getAccountStatus()).rejects.toThrow("banned");
		});
	});
});
