import type { DifficultyName } from "@fangdash/shared";
import {
	type PendingScoreEntry,
	addPendingScore,
	getAllPendingScores,
	removePendingScore,
	updatePendingScore,
} from "./score-store.ts";

// ---------------------------------------------------------------------------
// Retry config
// ---------------------------------------------------------------------------

const BACKOFF_DELAYS = [5_000, 15_000, 45_000, 120_000, 300_000]; // 5s, 15s, 45s, 2min, 5min
const MAX_RETRIES = BACKOFF_DELAYS.length;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScorePayload {
	score: number;
	distance: number;
	obstaclesCleared: number;
	longestCleanRun: number;
	duration: number;
	seed: string;
	difficulty: DifficultyName;
	mods: number;
	cheated?: boolean;
}

export interface SubmitResult {
	scoreId: string;
	newAchievements: string[];
	newSkins: string[];
	unlockError: boolean;
	xpGained: number;
	levelUp: boolean;
	newLevel: number;
}

type SubmitFn = (payload: ScorePayload) => Promise<SubmitResult>;

// A CONFLICT means the server already has a score for this run's seed — typically
// because the live submit on the play page already succeeded and this is the
// redundant offline-backup copy. It must be treated as terminal success (drop the
// entry), not retried, or the unique (player, seed) index churns retries forever.
function isAlreadySubmitted(err: unknown): boolean {
	if (typeof err !== "object" || err === null) return false;
	const e = err as {
		data?: { code?: string } | null;
		shape?: { data?: { code?: string } | null } | null;
	};
	return e.data?.code === "CONFLICT" || e.shape?.data?.code === "CONFLICT";
}

// ---------------------------------------------------------------------------
// ScoreQueue
// ---------------------------------------------------------------------------

let retryTimeout: ReturnType<typeof setTimeout> | null = null;

export async function enqueue(
	type: "solo" | "race",
	payload: ScorePayload,
	raceId?: string,
): Promise<number> {
	const id = await addPendingScore({
		type,
		payload: { ...payload, cheated: payload.cheated ?? false },
		raceId,
	});

	return id;
}

export async function processQueue(submitFn: SubmitFn): Promise<SubmitResult[]> {
	if (typeof window === "undefined") return [];
	if (!navigator.onLine) return [];

	const pending = await getAllPendingScores();
	const results: SubmitResult[] = [];

	for (const entry of pending) {
		if (entry.status === "syncing") continue;
		if (entry.status === "failed" && entry.retryCount >= MAX_RETRIES) continue;

		// Check backoff timing
		if (entry.lastAttempt && entry.retryCount > 0) {
			const delay = BACKOFF_DELAYS[Math.min(entry.retryCount - 1, BACKOFF_DELAYS.length - 1)] ?? 0;
			if (Date.now() - entry.lastAttempt < delay) continue;
		}

		const result = await submitOne(entry, submitFn);
		if (result) results.push(result);
	}

	return results;
}

async function submitOne(
	entry: PendingScoreEntry,
	submitFn: SubmitFn,
): Promise<SubmitResult | null> {
	if (!entry.id) return null;

	await updatePendingScore(entry.id, { status: "syncing", lastAttempt: Date.now() });

	try {
		const result = await submitFn({
			score: entry.payload.score,
			distance: entry.payload.distance,
			obstaclesCleared: entry.payload.obstaclesCleared,
			longestCleanRun: entry.payload.longestCleanRun,
			duration: entry.payload.duration,
			seed: entry.payload.seed,
			difficulty: entry.payload.difficulty as DifficultyName,
			mods: entry.payload.mods,
			cheated: entry.payload.cheated,
		});

		await removePendingScore(entry.id);
		return result;
	} catch (err) {
		// Already on the server (e.g. the live submit beat this backup) — drop it.
		if (isAlreadySubmitted(err)) {
			await removePendingScore(entry.id);
			return null;
		}
		const newRetryCount = entry.retryCount + 1;
		await updatePendingScore(entry.id, {
			status: newRetryCount >= MAX_RETRIES ? "failed" : "pending",
			retryCount: newRetryCount,
		});
		scheduleRetry(submitFn, newRetryCount);
		return null;
	}
}

function scheduleRetry(submitFn: SubmitFn, retryCount: number) {
	if (retryTimeout) return; // Already scheduled
	const delay = BACKOFF_DELAYS[Math.min(retryCount - 1, BACKOFF_DELAYS.length - 1)] ?? 0;
	retryTimeout = setTimeout(() => {
		retryTimeout = null;
		processQueue(submitFn);
	}, delay);
}

export function setupOnlineListener(submitFn: SubmitFn): () => void {
	const handler = () => processQueue(submitFn);
	window.addEventListener("online", handler);
	return () => window.removeEventListener("online", handler);
}
