import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from "vitest";

// ---------------------------------------------------------------------------
// Mock the score-store module
// ---------------------------------------------------------------------------

vi.mock("@/lib/score-store.ts", () => ({
	computeHMAC: vi.fn().mockResolvedValue("mocked-hmac"),
	addPendingScore: vi.fn().mockResolvedValue(1),
	getAllPendingScores: vi.fn().mockResolvedValue([]),
	removePendingScore: vi.fn().mockResolvedValue(undefined),
	updatePendingScore: vi.fn().mockResolvedValue(undefined),
	getPendingScores: vi.fn().mockResolvedValue([]),
}));

import {
	enqueue,
	processQueue,
	setupOnlineListener,
	type SubmitResult,
} from "@/lib/score-queue.ts";
import * as scoreStore from "@/lib/score-store.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const basePayload = {
	score: 100,
	distance: 500,
	obstaclesCleared: 5,
	longestCleanRun: 100,
	duration: 30000,
	seed: "test-seed",
	difficulty: "easy" as const,
	mods: 0,
};

const baseResult: SubmitResult = {
	scoreId: "server-score-1",
	newAchievements: [],
	newSkins: [],
	achievementError: false,
	xpGained: 100,
	levelUp: false,
	newLevel: 1,
};

function makePendingEntry(overrides: Partial<scoreStore.PendingScoreEntry> = {}): scoreStore.PendingScoreEntry {
	return {
		id: 1,
		type: "solo",
		payload: {
			score: 100,
			distance: 500,
			obstaclesCleared: 5,
			longestCleanRun: 100,
			duration: 30000,
			seed: "test-seed",
			difficulty: "easy",
			mods: 0,
			cheated: false,
		},
		createdAt: Date.now(),
		retryCount: 0,
		lastAttempt: null,
		status: "pending",
		hmac: "mocked-hmac",
		...overrides,
	};
}

beforeEach(() => {
	vi.clearAllMocks();
	// Use fake timers globally to prevent real timers from leaking
	// between tests (module-level retryTimeout state)
	vi.useFakeTimers();
	vi.stubGlobal("window", globalThis);
	vi.stubGlobal("navigator", { onLine: true });
});

afterEach(() => {
	vi.runOnlyPendingTimers();
	vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// enqueue
// ---------------------------------------------------------------------------

describe("enqueue", () => {
	it("computes HMAC + calls addPendingScore", async () => {
		const id = await enqueue("solo", basePayload, "salt-123");
		expect(scoreStore.computeHMAC).toHaveBeenCalledWith(
			{ ...basePayload, cheated: false },
			"salt-123",
		);
		expect(scoreStore.addPendingScore).toHaveBeenCalledWith({
			type: "solo",
			payload: { ...basePayload, cheated: false },
			raceId: undefined,
			hmac: "mocked-hmac",
		});
		expect(id).toBe(1);
	});

	it("returns id", async () => {
		(scoreStore.addPendingScore as Mock).mockResolvedValueOnce(42);
		const id = await enqueue("solo", basePayload, "salt");
		expect(id).toBe(42);
	});

	it("defaults cheated to false", async () => {
		await enqueue("solo", basePayload, "salt");
		expect(scoreStore.computeHMAC).toHaveBeenCalledWith(
			expect.objectContaining({ cheated: false }),
			"salt",
		);
	});

	it("passes raceId", async () => {
		await enqueue("race", basePayload, "salt", "race-123");
		expect(scoreStore.addPendingScore).toHaveBeenCalledWith(
			expect.objectContaining({ raceId: "race-123", type: "race" }),
		);
	});
});

// ---------------------------------------------------------------------------
// processQueue
// ---------------------------------------------------------------------------

describe("processQueue", () => {
	it("returns [] offline", async () => {
		vi.stubGlobal("navigator", { onLine: false });
		const submitFn = vi.fn();
		const results = await processQueue(submitFn);
		expect(results).toEqual([]);
		expect(submitFn).not.toHaveBeenCalled();
	});

	it("skips syncing entries", async () => {
		(scoreStore.getAllPendingScores as Mock).mockResolvedValueOnce([
			makePendingEntry({ status: "syncing" }),
		]);
		const submitFn = vi.fn();
		const results = await processQueue(submitFn);
		expect(results).toEqual([]);
		expect(submitFn).not.toHaveBeenCalled();
	});

	it("skips failed at max retries (5)", async () => {
		(scoreStore.getAllPendingScores as Mock).mockResolvedValueOnce([
			makePendingEntry({ status: "failed", retryCount: 5 }),
		]);
		const submitFn = vi.fn();
		const results = await processQueue(submitFn);
		expect(results).toEqual([]);
		expect(submitFn).not.toHaveBeenCalled();
	});

	it("processes pending + removes on success", async () => {
		(scoreStore.getAllPendingScores as Mock).mockResolvedValueOnce([
			makePendingEntry({ id: 10 }),
		]);
		const submitFn = vi.fn().mockResolvedValueOnce(baseResult);
		const results = await processQueue(submitFn);
		expect(results).toHaveLength(1);
		expect(results[0]!.scoreId).toBe("server-score-1");
		expect(scoreStore.removePendingScore).toHaveBeenCalledWith(10);
	});

	it("sets syncing during attempt", async () => {
		(scoreStore.getAllPendingScores as Mock).mockResolvedValueOnce([
			makePendingEntry({ id: 5 }),
		]);
		const submitFn = vi.fn().mockResolvedValueOnce(baseResult);
		await processQueue(submitFn);
		expect(scoreStore.updatePendingScore).toHaveBeenCalledWith(
			5,
			expect.objectContaining({ status: "syncing" }),
		);
	});

	it("increments retryCount on failure", async () => {
		(scoreStore.getAllPendingScores as Mock).mockResolvedValueOnce([
			makePendingEntry({ id: 7, retryCount: 1 }),
		]);
		const submitFn = vi.fn().mockRejectedValueOnce(new Error("network"));
		await processQueue(submitFn);
		expect(scoreStore.updatePendingScore).toHaveBeenCalledWith(
			7,
			expect.objectContaining({ retryCount: 2, status: "pending" }),
		);
	});

	it("sets failed at max retries", async () => {
		(scoreStore.getAllPendingScores as Mock).mockResolvedValueOnce([
			makePendingEntry({ id: 8, retryCount: 4 }),
		]);
		const submitFn = vi.fn().mockRejectedValueOnce(new Error("network"));
		await processQueue(submitFn);
		expect(scoreStore.updatePendingScore).toHaveBeenCalledWith(
			8,
			expect.objectContaining({ retryCount: 5, status: "failed" }),
		);
	});

	it("respects backoff timing — skips when too early", async () => {
		(scoreStore.getAllPendingScores as Mock).mockResolvedValueOnce([
			makePendingEntry({
				id: 9,
				retryCount: 1,
				lastAttempt: Date.now() - 1000, // 1s ago, backoff is 5s
				status: "pending",
			}),
		]);
		const submitFn = vi.fn();
		const results = await processQueue(submitFn);
		expect(results).toEqual([]);
		expect(submitFn).not.toHaveBeenCalled();
	});

	it("processes when backoff elapsed", async () => {
		(scoreStore.getAllPendingScores as Mock).mockResolvedValueOnce([
			makePendingEntry({
				id: 11,
				retryCount: 1,
				lastAttempt: Date.now() - 10000, // 10s ago, backoff is 5s
				status: "pending",
			}),
		]);
		const submitFn = vi.fn().mockResolvedValueOnce(baseResult);
		const results = await processQueue(submitFn);
		expect(results).toHaveLength(1);
	});
});

// ---------------------------------------------------------------------------
// retry scheduling
// ---------------------------------------------------------------------------

describe("retry scheduling", () => {
	it("schedules retry on failure", async () => {
		(scoreStore.getAllPendingScores as Mock).mockResolvedValueOnce([
			makePendingEntry({ id: 20, retryCount: 0 }),
		]);
		const submitFn = vi.fn().mockRejectedValueOnce(new Error("fail"));

		await processQueue(submitFn);

		// submitFn was called and failed
		expect(submitFn).toHaveBeenCalledTimes(1);
		// retryCount incremented to 1, status set to pending
		expect(scoreStore.updatePendingScore).toHaveBeenCalledWith(
			20,
			expect.objectContaining({ retryCount: 1, status: "pending" }),
		);
		// A timer should have been scheduled
		expect(vi.getTimerCount()).toBeGreaterThan(0);
	});
});

// ---------------------------------------------------------------------------
// setupOnlineListener
// ---------------------------------------------------------------------------

describe("setupOnlineListener", () => {
	it("adds online listener", () => {
		const addSpy = vi.fn();
		const removeSpy = vi.fn();
		vi.stubGlobal("window", {
			addEventListener: addSpy,
			removeEventListener: removeSpy,
		});

		const submitFn = vi.fn();
		setupOnlineListener(submitFn);
		expect(addSpy).toHaveBeenCalledWith("online", expect.any(Function));
	});

	it("removes on cleanup", () => {
		const addSpy = vi.fn();
		const removeSpy = vi.fn();
		vi.stubGlobal("window", {
			addEventListener: addSpy,
			removeEventListener: removeSpy,
		});

		const submitFn = vi.fn();
		const cleanup = setupOnlineListener(submitFn);
		cleanup();
		expect(removeSpy).toHaveBeenCalledWith("online", expect.any(Function));
	});

	it("fires processQueue on online event", async () => {
		let handler: Function | undefined;
		vi.stubGlobal("window", {
			addEventListener: (_event: string, fn: Function) => {
				handler = fn;
			},
			removeEventListener: vi.fn(),
		});

		const submitFn = vi.fn();
		setupOnlineListener(submitFn);
		expect(handler).toBeDefined();

		// Calling handler should invoke processQueue which calls getAllPendingScores
		(scoreStore.getAllPendingScores as Mock).mockResolvedValueOnce([]);
		await handler!();
		expect(scoreStore.getAllPendingScores).toHaveBeenCalled();
	});
});
