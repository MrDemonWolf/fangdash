import { ACHIEVEMENTS } from "@fangdash/shared/achievements";
import type { AchievementDefinition } from "@fangdash/shared/types";
import { eq, max } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type * as schema from "../db/schema.ts";
import { player, playerAchievement, playerSkin, score } from "../db/schema.ts";

export interface PlayerStats {
	highestScore: number;
	highestDistance: number;
	totalScore: number;
	totalDistance: number;
	totalObstaclesCleared: number;
	gamesPlayed: number;
	racesPlayed: number;
	racesWon: number;
	longestCleanRun: number;
}

export interface CheckStats {
	highestScore: number;
	highestDistance: number;
}

interface CheckResult {
	newAchievements: string[];
	newSkins: string[];
	stats: CheckStats;
}

/**
 * Checks all achievements for a player and grants newly earned ones.
 * Also grants reward skins from newly unlocked achievements.
 */
export async function checkAchievements(
	db: DrizzleD1Database<typeof schema>,
	playerId: string,
	latestScore?: {
		score: number;
		distance: number;
		obstaclesCleared: number;
		longestCleanRun?: number;
	},
): Promise<CheckResult> {
	// Get player stats
	const playerRecord = await db.select().from(player).where(eq(player.id, playerId)).get();

	const emptyStats: CheckStats = { highestScore: 0, highestDistance: 0 };
	if (!playerRecord) {
		return { newAchievements: [], newSkins: [], stats: emptyStats };
	}

	// Get already unlocked achievements
	const existing = await db
		.select({ achievementId: playerAchievement.achievementId })
		.from(playerAchievement)
		.where(eq(playerAchievement.playerId, playerId));

	const unlockedIds = new Set(existing.map((e) => e.achievementId));

	// Get highest single-run score, distance, and clean run from score history
	const maxStats = await db
		.select({
			highestScore: max(score.score),
			highestDistance: max(score.distance),
			highestCleanRun: max(score.longestCleanRun),
		})
		.from(score)
		.where(eq(score.playerId, playerId))
		.get();

	const stats: PlayerStats = {
		highestScore: Math.max(maxStats?.highestScore ?? 0, latestScore?.score ?? 0),
		highestDistance: Math.max(maxStats?.highestDistance ?? 0, latestScore?.distance ?? 0),
		totalScore: playerRecord.totalScore,
		totalDistance: playerRecord.totalDistance,
		totalObstaclesCleared: playerRecord.totalObstaclesCleared,
		gamesPlayed: playerRecord.gamesPlayed,
		racesPlayed: playerRecord.racesPlayed,
		racesWon: playerRecord.racesWon,
		longestCleanRun: Math.max(maxStats?.highestCleanRun ?? 0, latestScore?.longestCleanRun ?? 0),
	};

	const checkStats: CheckStats = {
		highestScore: stats.highestScore,
		highestDistance: stats.highestDistance,
	};

	const newAchievements: string[] = [];
	const rewardSkinIds: string[] = [];
	const now = new Date();

	// Collect newly earned achievements
	const achievementRows: {
		id: string;
		playerId: string;
		achievementId: string;
		unlockedAt: Date;
	}[] = [];
	for (const achievement of ACHIEVEMENTS) {
		if (unlockedIds.has(achievement.id)) {
			continue;
		}
		if (isAchievementEarned(achievement, stats)) {
			achievementRows.push({
				id: crypto.randomUUID(),
				playerId,
				achievementId: achievement.id,
				unlockedAt: now,
			});
			newAchievements.push(achievement.id);
			if (achievement.rewardSkinId) {
				rewardSkinIds.push(achievement.rewardSkinId);
			}
		}
	}

	// Batch insert achievements
	if (achievementRows.length > 0) {
		await db.insert(playerAchievement).values(achievementRows);
	}

	// Batch insert reward skins (skip conflicts — player may already own them)
	let newSkins: string[] = [];
	if (rewardSkinIds.length > 0) {
		const inserted = await db
			.insert(playerSkin)
			.values(
				rewardSkinIds.map((skinId) => ({
					id: crypto.randomUUID(),
					playerId,
					skinId,
					unlockedAt: now,
				})),
			)
			.onConflictDoNothing()
			.returning({ skinId: playerSkin.skinId });
		newSkins = inserted.map((r) => r.skinId);
	}

	return { newAchievements, newSkins, stats: checkStats };
}

export function isAchievementEarned(
	achievement: AchievementDefinition,
	stats: PlayerStats,
): boolean {
	const { condition } = achievement;

	switch (condition.type) {
		case "score_single":
			return stats.highestScore >= condition.threshold;
		case "score_total":
			return stats.totalScore >= condition.threshold;
		case "distance_single":
			return stats.highestDistance >= condition.threshold;
		case "distance_total":
			return stats.totalDistance >= condition.threshold;
		case "games_played":
			return stats.gamesPlayed >= condition.count;
		case "obstacles_cleared":
			return stats.totalObstaclesCleared >= condition.count;
		case "races_won":
			return stats.racesWon >= condition.count;
		case "races_played":
			return stats.racesPlayed >= condition.count;
		case "perfect_run":
			return stats.longestCleanRun >= condition.distance;
		default:
			return false;
	}
}
