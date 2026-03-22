import { type DBSchema, type IDBPDatabase, openDB } from "idb";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

export interface PendingScoreEntry {
	id?: number;
	type: "solo" | "race";
	payload: {
		score: number;
		distance: number;
		obstaclesCleared: number;
		longestCleanRun: number;
		duration: number;
		seed: string;
		difficulty: string;
		mods: number;
		cheated: boolean;
	};
	raceId?: string | undefined;
	createdAt: number;
	retryCount: number;
	lastAttempt: number | null;
	status: "pending" | "syncing" | "failed";
	hmac: string;
}

export interface ScoreHistoryEntry {
	id?: number;
	type: "solo" | "race";
	score: number;
	distance: number;
	duration: number;
	difficulty: string;
	mods: number;
	createdAt: number;
	cheated: boolean;
	synced: boolean;
	serverScoreId?: string;
}

interface FangDashScoresDB extends DBSchema {
	"pending-scores": {
		key: number;
		value: PendingScoreEntry;
		indexes: { "by-status": string };
	};
	"score-history": {
		key: number;
		value: ScoreHistoryEntry;
		indexes: { "by-synced": number };
	};
}

// ---------------------------------------------------------------------------
// Database singleton
// ---------------------------------------------------------------------------

let dbPromise: Promise<IDBPDatabase<FangDashScoresDB>> | null = null;

function getDB(): Promise<IDBPDatabase<FangDashScoresDB>> {
	if (typeof window === "undefined") {
		return Promise.reject(new Error("IndexedDB not available in SSR"));
	}
	if (!dbPromise) {
		dbPromise = openDB<FangDashScoresDB>("fangdash-scores", 1, {
			upgrade(db) {
				const pendingStore = db.createObjectStore("pending-scores", {
					keyPath: "id",
					autoIncrement: true,
				});
				pendingStore.createIndex("by-status", "status");

				const historyStore = db.createObjectStore("score-history", {
					keyPath: "id",
					autoIncrement: true,
				});
				historyStore.createIndex("by-synced", "synced");
			},
		});
	}
	return dbPromise;
}

// ---------------------------------------------------------------------------
// HMAC helper
// ---------------------------------------------------------------------------

export async function computeHMAC(
	payload: PendingScoreEntry["payload"],
	salt: string,
): Promise<string> {
	const data = JSON.stringify(payload) + salt;
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(salt),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
	return Array.from(new Uint8Array(sig))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

// ---------------------------------------------------------------------------
// Pending scores CRUD
// ---------------------------------------------------------------------------

export async function addPendingScore(
	entry: Omit<PendingScoreEntry, "id" | "createdAt" | "retryCount" | "lastAttempt" | "status">,
): Promise<number> {
	const db = await getDB();
	return db.add("pending-scores", {
		...entry,
		createdAt: Date.now(),
		retryCount: 0,
		lastAttempt: null,
		status: "pending",
	} as PendingScoreEntry);
}

export async function getPendingScores(): Promise<PendingScoreEntry[]> {
	const db = await getDB();
	return db.getAllFromIndex("pending-scores", "by-status", "pending");
}

export async function getAllPendingScores(): Promise<PendingScoreEntry[]> {
	const db = await getDB();
	return db.getAll("pending-scores");
}

export async function removePendingScore(id: number): Promise<void> {
	const db = await getDB();
	await db.delete("pending-scores", id);
}

export async function updatePendingScore(
	id: number,
	updates: Partial<PendingScoreEntry>,
): Promise<void> {
	const db = await getDB();
	const existing = await db.get("pending-scores", id);
	if (!existing) return;
	await db.put("pending-scores", { ...existing, ...updates, id });
}

// ---------------------------------------------------------------------------
// Score history CRUD
// ---------------------------------------------------------------------------

export async function addToHistory(
	entry: Omit<ScoreHistoryEntry, "id" | "createdAt" | "synced">,
): Promise<number> {
	const db = await getDB();
	return db.add("score-history", {
		...entry,
		createdAt: Date.now(),
		synced: false,
	} as ScoreHistoryEntry);
}

export async function getHistory(limit = 20): Promise<ScoreHistoryEntry[]> {
	const db = await getDB();
	const all = await db.getAll("score-history");
	return all.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
}

export async function getUnsyncedHistory(): Promise<ScoreHistoryEntry[]> {
	const db = await getDB();
	return db.getAllFromIndex("score-history", "by-synced", 0);
}

export async function markHistorySynced(id: number, serverScoreId: string): Promise<void> {
	const db = await getDB();
	const existing = await db.get("score-history", id);
	if (!existing) return;
	await db.put("score-history", { ...existing, synced: true, serverScoreId, id });
}
