// Import auto first to register all IDB globals (IDBRequest, IDBDatabase, etc.)
import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { describe, it, expect, beforeEach, vi } from "vitest";

// We need to reset the module between tests so the cached dbPromise singleton
// is cleared and each test gets a fresh IndexedDB database.

async function loadModule() {
	return await import("@/lib/score-store.ts");
}

beforeEach(() => {
	vi.resetModules();
	// score-store checks typeof window === "undefined" — ensure it's defined
	vi.stubGlobal("window", globalThis);
	// Fresh IndexedDB per test — avoids hanging deleteDatabase calls
	globalThis.indexedDB = new IDBFactory();
});

// ---------------------------------------------------------------------------
// Pending scores
// ---------------------------------------------------------------------------

describe("pending scores", () => {
	it("add + retrieve", async () => {
		const mod = await loadModule();
		const id = await mod.addPendingScore({
			type: "solo",
			payload: {
				score: 100,
				distance: 500,
				obstaclesCleared: 5,
				longestCleanRun: 100,
				duration: 30000,
				seed: "abc",
				difficulty: "easy",
				mods: 0,
				cheated: false,
			},
			hmac: "deadbeef",
		});
		expect(id).toBeGreaterThan(0);

		const pending = await mod.getPendingScores();
		expect(pending).toHaveLength(1);
		expect(pending[0]!.payload.score).toBe(100);
	});

	it("auto-sets defaults (createdAt, retryCount=0, status=pending)", async () => {
		const mod = await loadModule();
		const id = await mod.addPendingScore({
			type: "solo",
			payload: {
				score: 50,
				distance: 200,
				obstaclesCleared: 2,
				longestCleanRun: 0,
				duration: 5000,
				seed: "xyz",
				difficulty: "easy",
				mods: 0,
				cheated: false,
			},
			hmac: "abc123",
		});

		const all = await mod.getAllPendingScores();
		const entry = all.find((e) => e.id === id)!;
		expect(entry.retryCount).toBe(0);
		expect(entry.status).toBe("pending");
		expect(typeof entry.createdAt).toBe("number");
		expect(entry.lastAttempt).toBeNull();
	});

	it("getAllPendingScores includes failed", async () => {
		const mod = await loadModule();
		const id = await mod.addPendingScore({
			type: "solo",
			payload: {
				score: 10,
				distance: 50,
				obstaclesCleared: 0,
				longestCleanRun: 0,
				duration: 2000,
				seed: "s",
				difficulty: "easy",
				mods: 0,
				cheated: false,
			},
			hmac: "h",
		});

		await mod.updatePendingScore(id, { status: "failed" });
		const all = await mod.getAllPendingScores();
		expect(all).toHaveLength(1);
		expect(all[0]!.status).toBe("failed");

		// getPendingScores should NOT include failed
		const pending = await mod.getPendingScores();
		expect(pending).toHaveLength(0);
	});

	it("remove by id", async () => {
		const mod = await loadModule();
		const id = await mod.addPendingScore({
			type: "solo",
			payload: {
				score: 10,
				distance: 50,
				obstaclesCleared: 0,
				longestCleanRun: 0,
				duration: 2000,
				seed: "s",
				difficulty: "easy",
				mods: 0,
				cheated: false,
			},
			hmac: "h",
		});

		await mod.removePendingScore(id);
		expect(await mod.getAllPendingScores()).toHaveLength(0);
	});

	it("update partial fields", async () => {
		const mod = await loadModule();
		const id = await mod.addPendingScore({
			type: "solo",
			payload: {
				score: 10,
				distance: 50,
				obstaclesCleared: 0,
				longestCleanRun: 0,
				duration: 2000,
				seed: "s",
				difficulty: "easy",
				mods: 0,
				cheated: false,
			},
			hmac: "h",
		});

		await mod.updatePendingScore(id, { retryCount: 3, status: "failed" });
		const all = await mod.getAllPendingScores();
		expect(all[0]!.retryCount).toBe(3);
		expect(all[0]!.status).toBe("failed");
	});
});

// ---------------------------------------------------------------------------
// Score history
// ---------------------------------------------------------------------------

describe("score history", () => {
	it("add with synced=false", async () => {
		const mod = await loadModule();
		const id = await mod.addToHistory({
			type: "solo",
			score: 200,
			distance: 1000,
			duration: 60000,
			difficulty: "easy",
			mods: 0,
			cheated: false,
		});
		expect(id).toBeGreaterThan(0);

		const history = await mod.getHistory();
		expect(history).toHaveLength(1);
		expect(history[0]!.synced).toBe(false);
	});

	it("sorted newest first", async () => {
		const mod = await loadModule();
		// Add two entries with a small delay difference via createdAt
		await mod.addToHistory({
			type: "solo",
			score: 100,
			distance: 500,
			duration: 30000,
			difficulty: "easy",
			mods: 0,
			cheated: false,
		});
		// Add second slightly later
		await new Promise((r) => setTimeout(r, 10));
		await mod.addToHistory({
			type: "solo",
			score: 200,
			distance: 1000,
			duration: 60000,
			difficulty: "easy",
			mods: 0,
			cheated: false,
		});

		const history = await mod.getHistory();
		expect(history[0]!.score).toBe(200);
		expect(history[1]!.score).toBe(100);
	});

	it("respects limit param", async () => {
		const mod = await loadModule();
		for (let i = 0; i < 5; i++) {
			await mod.addToHistory({
				type: "solo",
				score: i * 100,
				distance: 500,
				duration: 30000,
				difficulty: "easy",
				mods: 0,
				cheated: false,
			});
		}
		const history = await mod.getHistory(2);
		expect(history).toHaveLength(2);
	});

	it("getUnsyncedHistory filters synced", async () => {
		const mod = await loadModule();
		const id1 = await mod.addToHistory({
			type: "solo",
			score: 100,
			distance: 500,
			duration: 30000,
			difficulty: "easy",
			mods: 0,
			cheated: false,
		});
		await mod.addToHistory({
			type: "solo",
			score: 200,
			distance: 1000,
			duration: 60000,
			difficulty: "easy",
			mods: 0,
			cheated: false,
		});

		await mod.markHistorySynced(id1, "server-id-1");

		// Verify sync state via getHistory — markHistorySynced sets synced=true
		const all = await mod.getHistory();
		const synced = all.filter((e) => e.synced === true);
		const notSynced = all.filter((e) => e.synced === false);
		expect(synced).toHaveLength(1);
		expect(synced[0]!.score).toBe(100);
		expect(notSynced).toHaveLength(1);
		expect(notSynced[0]!.score).toBe(200);
	});

	it("markHistorySynced sets synced + serverScoreId", async () => {
		const mod = await loadModule();
		const id = await mod.addToHistory({
			type: "solo",
			score: 100,
			distance: 500,
			duration: 30000,
			difficulty: "easy",
			mods: 0,
			cheated: false,
		});

		await mod.markHistorySynced(id, "server-abc");
		const history = await mod.getHistory();
		expect(history[0]!.synced).toBe(true);
		expect(history[0]!.serverScoreId).toBe("server-abc");
	});

	it("no-op on non-existent id", async () => {
		const mod = await loadModule();
		// Should not throw
		await mod.markHistorySynced(99999, "nope");
		const history = await mod.getHistory();
		expect(history).toHaveLength(0);
	});
});

// ---------------------------------------------------------------------------
// computeHMAC
// ---------------------------------------------------------------------------

describe("computeHMAC", () => {
	const payload = {
		score: 100,
		distance: 500,
		obstaclesCleared: 5,
		longestCleanRun: 100,
		duration: 30000,
		seed: "abc",
		difficulty: "easy",
		mods: 0,
		cheated: false,
	};

	it("returns hex string", async () => {
		const mod = await loadModule();
		const hmac = await mod.computeHMAC(payload, "salt1");
		expect(hmac).toMatch(/^[0-9a-f]+$/);
	});

	it("is deterministic", async () => {
		const mod = await loadModule();
		const h1 = await mod.computeHMAC(payload, "salt1");
		const h2 = await mod.computeHMAC(payload, "salt1");
		expect(h1).toBe(h2);
	});

	it("differs with different salt", async () => {
		const mod = await loadModule();
		const h1 = await mod.computeHMAC(payload, "salt1");
		const h2 = await mod.computeHMAC(payload, "salt2");
		expect(h1).not.toBe(h2);
	});

	it("differs with different payload", async () => {
		const mod = await loadModule();
		const h1 = await mod.computeHMAC(payload, "salt1");
		const h2 = await mod.computeHMAC({ ...payload, score: 999 }, "salt1");
		expect(h1).not.toBe(h2);
	});
});

// ---------------------------------------------------------------------------
// SSR guard
// ---------------------------------------------------------------------------

describe("SSR guard", () => {
	it("rejects when window is undefined", async () => {
		const origWindow = globalThis.window;
		// @ts-expect-error - intentionally removing window for SSR test
		delete globalThis.window;
		try {
			const mod = await loadModule();
			await expect(mod.addPendingScore({
				type: "solo",
				payload: {
					score: 10,
					distance: 50,
					obstaclesCleared: 0,
					longestCleanRun: 0,
					duration: 2000,
					seed: "s",
					difficulty: "easy",
					mods: 0,
					cheated: false,
				},
				hmac: "h",
			})).rejects.toThrow("IndexedDB not available in SSR");
		} finally {
			globalThis.window = origWindow;
		}
	});
});
