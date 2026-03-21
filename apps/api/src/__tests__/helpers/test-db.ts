import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../../db/schema.ts";

const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS user (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	email TEXT NOT NULL UNIQUE,
	email_verified INTEGER NOT NULL DEFAULT 0,
	image TEXT,
	twitch_id TEXT UNIQUE,
	twitch_avatar TEXT,
	role TEXT NOT NULL DEFAULT 'user',
	banned INTEGER,
	ban_reason TEXT,
	ban_expires INTEGER,
	deletion_requested_at INTEGER,
	deletion_scheduled_for INTEGER,
	created_at INTEGER NOT NULL,
	updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS session (
	id TEXT PRIMARY KEY,
	expires_at INTEGER NOT NULL,
	token TEXT NOT NULL UNIQUE,
	created_at INTEGER NOT NULL,
	updated_at INTEGER NOT NULL,
	ip_address TEXT,
	user_agent TEXT,
	user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS account (
	id TEXT PRIMARY KEY,
	account_id TEXT NOT NULL,
	provider_id TEXT NOT NULL,
	user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
	access_token TEXT,
	refresh_token TEXT,
	id_token TEXT,
	access_token_expires_at INTEGER,
	refresh_token_expires_at INTEGER,
	scope TEXT,
	password TEXT,
	created_at INTEGER NOT NULL,
	updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS verification (
	id TEXT PRIMARY KEY,
	identifier TEXT NOT NULL,
	value TEXT NOT NULL,
	expires_at INTEGER NOT NULL,
	created_at INTEGER,
	updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS player (
	id TEXT PRIMARY KEY,
	user_id TEXT NOT NULL UNIQUE REFERENCES user(id) ON DELETE CASCADE,
	equipped_skin_id TEXT NOT NULL DEFAULT 'gray-wolf',
	profile_public INTEGER NOT NULL DEFAULT 1,
	total_score INTEGER NOT NULL DEFAULT 0,
	total_distance REAL NOT NULL DEFAULT 0,
	total_obstacles_cleared INTEGER NOT NULL DEFAULT 0,
	games_played INTEGER NOT NULL DEFAULT 0,
	races_played INTEGER NOT NULL DEFAULT 0,
	races_won INTEGER NOT NULL DEFAULT 0,
	total_xp INTEGER NOT NULL DEFAULT 0,
	level INTEGER NOT NULL DEFAULT 1,
	created_at INTEGER NOT NULL,
	updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS score (
	id TEXT PRIMARY KEY,
	player_id TEXT NOT NULL REFERENCES player(id) ON DELETE CASCADE,
	score INTEGER NOT NULL,
	distance REAL NOT NULL,
	obstacles_cleared INTEGER NOT NULL,
	duration INTEGER NOT NULL,
	difficulty TEXT NOT NULL DEFAULT 'easy',
	mods INTEGER NOT NULL DEFAULT 0,
	longest_clean_run INTEGER NOT NULL DEFAULT 0,
	seed TEXT NOT NULL,
	cheated INTEGER NOT NULL DEFAULT 0,
	created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS score_player_id_idx ON score(player_id);
CREATE INDEX IF NOT EXISTS score_difficulty_idx ON score(difficulty);
CREATE INDEX IF NOT EXISTS score_mods_idx ON score(mods);
CREATE INDEX IF NOT EXISTS score_created_at_idx ON score(created_at);
CREATE INDEX IF NOT EXISTS score_cheated_idx ON score(cheated);
CREATE INDEX IF NOT EXISTS score_leaderboard_idx ON score(player_id, cheated, difficulty);

CREATE TABLE IF NOT EXISTS player_skin (
	id TEXT PRIMARY KEY,
	player_id TEXT NOT NULL REFERENCES player(id) ON DELETE CASCADE,
	skin_id TEXT NOT NULL,
	unlocked_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS player_skin_unique ON player_skin(player_id, skin_id);

CREATE TABLE IF NOT EXISTS player_achievement (
	id TEXT PRIMARY KEY,
	player_id TEXT NOT NULL REFERENCES player(id) ON DELETE CASCADE,
	achievement_id TEXT NOT NULL,
	unlocked_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS player_achievement_unique ON player_achievement(player_id, achievement_id);

CREATE TABLE IF NOT EXISTS race_history (
	id TEXT PRIMARY KEY,
	race_id TEXT NOT NULL,
	player_id TEXT NOT NULL REFERENCES player(id) ON DELETE CASCADE,
	placement INTEGER NOT NULL,
	score INTEGER NOT NULL,
	distance REAL NOT NULL,
	mods INTEGER NOT NULL DEFAULT 0,
	seed TEXT NOT NULL,
	cheated INTEGER NOT NULL DEFAULT 0,
	created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS race_history_player_id_idx ON race_history(player_id);
CREATE INDEX IF NOT EXISTS race_history_race_id_idx ON race_history(race_id);
CREATE INDEX IF NOT EXISTS race_history_created_at_idx ON race_history(created_at);
`;

export function createTestDb(): {
	db: ReturnType<typeof drizzle>;
	sqlite: InstanceType<typeof Database>;
} {
	const sqlite = new Database(":memory:");
	sqlite.exec(CREATE_TABLES_SQL);
	const db = drizzle(sqlite, { schema });

	// Polyfill D1's batch() method for better-sqlite3 drizzle
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	(db as any).batch = async (statements: any[]) => {
		const results = [];
		for (const stmt of statements) {
			results.push(await stmt);
		}
		return results;
	};

	return { db, sqlite };
}

export function createTestUser(
	db: ReturnType<typeof createTestDb>["db"],
	overrides: Partial<{
		id: string;
		name: string;
		email: string;
		role: string;
		banned: boolean;
		banReason: string | null;
		banExpires: Date | null;
	}> = {},
) {
	const now = new Date();
	const id = overrides.id ?? crypto.randomUUID();
	db.insert(schema.user)
		.values({
			id,
			name: overrides.name ?? "TestUser",
			email: overrides.email ?? `${id}@test.com`,
			emailVerified: false,
			role: overrides.role ?? "user",
			banned: overrides.banned ?? false,
			banReason: overrides.banReason ?? null,
			banExpires: overrides.banExpires ?? null,
			createdAt: now,
			updatedAt: now,
		})
		.run();
	return id;
}

export function createTestPlayer(
	db: ReturnType<typeof createTestDb>["db"],
	userId: string,
	overrides: Partial<{
		id: string;
		totalScore: number;
		totalDistance: number;
		totalObstaclesCleared: number;
		gamesPlayed: number;
		racesPlayed: number;
		racesWon: number;
		totalXp: number;
		level: number;
		equippedSkinId: string;
	}> = {},
) {
	const now = new Date();
	const id = overrides.id ?? crypto.randomUUID();
	db.insert(schema.player)
		.values({
			id,
			userId,
			equippedSkinId: overrides.equippedSkinId ?? "gray-wolf",
			totalScore: overrides.totalScore ?? 0,
			totalDistance: overrides.totalDistance ?? 0,
			totalObstaclesCleared: overrides.totalObstaclesCleared ?? 0,
			gamesPlayed: overrides.gamesPlayed ?? 0,
			racesPlayed: overrides.racesPlayed ?? 0,
			racesWon: overrides.racesWon ?? 0,
			totalXp: overrides.totalXp ?? 0,
			level: overrides.level ?? 1,
			createdAt: now,
			updatedAt: now,
		})
		.run();
	return id;
}

export function createTestScore(
	db: ReturnType<typeof createTestDb>["db"],
	playerId: string,
	overrides: Partial<{
		id: string;
		score: number;
		distance: number;
		obstaclesCleared: number;
		duration: number;
		difficulty: string;
		mods: number;
		longestCleanRun: number;
		seed: string;
		createdAt: Date;
	}> = {},
) {
	const id = overrides.id ?? crypto.randomUUID();
	db.insert(schema.score)
		.values({
			id,
			playerId,
			score: overrides.score ?? 100,
			distance: overrides.distance ?? 500,
			obstaclesCleared: overrides.obstaclesCleared ?? 5,
			duration: overrides.duration ?? 30000,
			difficulty: overrides.difficulty ?? "easy",
			mods: overrides.mods ?? 0,
			longestCleanRun: overrides.longestCleanRun ?? 0,
			seed: overrides.seed ?? "test-seed",
			createdAt: overrides.createdAt ?? new Date(),
		})
		.run();
	return id;
}

export type TestDb = ReturnType<typeof createTestDb>["db"];
