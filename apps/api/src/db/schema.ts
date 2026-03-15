import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// ── Better Auth Core Tables ──

export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
	image: text("image"),
	twitchId: text("twitch_id").unique(),
	twitchAvatar: text("twitch_avatar"),
	role: text("role").notNull().default("user"),
	banned: integer("banned", { mode: "boolean" }),
	banReason: text("ban_reason"),
	banExpires: integer("ban_expires", { mode: "timestamp" }),
	deletionRequestedAt: integer("deletion_requested_at"),
	deletionScheduledFor: integer("deletion_scheduled_for"),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
	id: text("id").primaryKey(),
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
	token: text("token").notNull().unique(),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: integer("access_token_expires_at", {
		mode: "timestamp",
	}),
	refreshTokenExpiresAt: integer("refresh_token_expires_at", {
		mode: "timestamp",
	}),
	scope: text("scope"),
	password: text("password"),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }),
	updatedAt: integer("updated_at", { mode: "timestamp" }),
});

// ── Game Tables ──

export const player = sqliteTable("player", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.unique()
		.references(() => user.id, { onDelete: "cascade" }),
	equippedSkinId: text("equipped_skin_id").notNull().default("gray-wolf"),
	profilePublic: integer("profile_public").notNull().default(1),
	totalScore: integer("total_score").notNull().default(0),
	totalDistance: real("total_distance").notNull().default(0),
	totalObstaclesCleared: integer("total_obstacles_cleared").notNull().default(0),
	gamesPlayed: integer("games_played").notNull().default(0),
	racesPlayed: integer("races_played").notNull().default(0),
	racesWon: integer("races_won").notNull().default(0),
	totalXp: integer("total_xp").notNull().default(0),
	level: integer("level").notNull().default(1),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const score = sqliteTable(
	"score",
	{
		id: text("id").primaryKey(),
		playerId: text("player_id")
			.notNull()
			.references(() => player.id, { onDelete: "cascade" }),
		score: integer("score").notNull(),
		distance: real("distance").notNull(),
		obstaclesCleared: integer("obstacles_cleared").notNull(),
		duration: integer("duration").notNull(),
		difficulty: text("difficulty").notNull().default("easy"),
		longestCleanRun: integer("longest_clean_run").notNull().default(0),
		seed: text("seed").notNull(),
		createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	},
	(table) => [
		index("score_player_id_idx").on(table.playerId),
		index("score_difficulty_idx").on(table.difficulty),
		index("score_created_at_idx").on(table.createdAt),
	],
);

export const playerSkin = sqliteTable(
	"player_skin",
	{
		id: text("id").primaryKey(),
		playerId: text("player_id")
			.notNull()
			.references(() => player.id, { onDelete: "cascade" }),
		skinId: text("skin_id").notNull(),
		unlockedAt: integer("unlocked_at", { mode: "timestamp" }).notNull(),
	},
	(table) => [uniqueIndex("player_skin_unique").on(table.playerId, table.skinId)],
);

export const playerAchievement = sqliteTable(
	"player_achievement",
	{
		id: text("id").primaryKey(),
		playerId: text("player_id")
			.notNull()
			.references(() => player.id, { onDelete: "cascade" }),
		achievementId: text("achievement_id").notNull(),
		unlockedAt: integer("unlocked_at", { mode: "timestamp" }).notNull(),
	},
	(table) => [uniqueIndex("player_achievement_unique").on(table.playerId, table.achievementId)],
);

export const raceHistory = sqliteTable(
	"race_history",
	{
		id: text("id").primaryKey(),
		raceId: text("race_id").notNull(),
		playerId: text("player_id")
			.notNull()
			.references(() => player.id, { onDelete: "cascade" }),
		placement: integer("placement").notNull(),
		score: integer("score").notNull(),
		distance: real("distance").notNull(),
		seed: text("seed").notNull(),
		createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	},
	(table) => [index("race_history_player_id_idx").on(table.playerId)],
);
