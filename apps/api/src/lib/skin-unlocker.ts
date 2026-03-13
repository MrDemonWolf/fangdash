import { SKINS } from "@fangdash/shared/skins";
import type { SkinDefinition } from "@fangdash/shared/types";
import { desc, eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type * as schema from "../db/schema.ts";
import { player, playerAchievement, playerSkin, score } from "../db/schema.ts";
import type { CheckStats } from "./achievement-checker.ts";

/**
 * Checks all skin unlock conditions for a player and grants newly unlocked skins.
 * Called after checkAchievements to properly handle achievement-based unlocks.
 * Returns list of newly unlocked skin IDs.
 */
export async function checkSkinUnlocks(
	db: DrizzleD1Database<typeof schema>,
	playerId: string,
	prefetchedStats?: CheckStats,
): Promise<string[]> {
	// Get player stats
	const playerRecord = await db.select().from(player).where(eq(player.id, playerId)).get();

	if (!playerRecord) {
		return [];
	}

	// Get already owned skins
	const ownedSkins = await db
		.select({ skinId: playerSkin.skinId })
		.from(playerSkin)
		.where(eq(playerSkin.playerId, playerId));

	const ownedSkinIds = new Set(ownedSkins.map((s) => s.skinId));

	// Get player's unlocked achievements
	const unlockedAchievements = await db
		.select({ achievementId: playerAchievement.achievementId })
		.from(playerAchievement)
		.where(eq(playerAchievement.playerId, playerId));

	const achievementIds = new Set(unlockedAchievements.map((a) => a.achievementId));

	const now = new Date();

	let highestScore: number;
	let highestDistance: number;

	if (prefetchedStats) {
		highestScore = prefetchedStats.highestScore;
		highestDistance = prefetchedStats.highestDistance;
	} else {
		const highestScoreRow = await db
			.select({ value: score.score })
			.from(score)
			.where(eq(score.playerId, playerId))
			.orderBy(desc(score.score))
			.limit(1)
			.get();

		const highestDistanceRow = await db
			.select({ value: score.distance })
			.from(score)
			.where(eq(score.playerId, playerId))
			.orderBy(desc(score.distance))
			.limit(1)
			.get();

		highestScore = highestScoreRow?.value ?? 0;
		highestDistance = highestDistanceRow?.value ?? 0;
	}

	// Collect skins to unlock
	const skinsToInsert: string[] = [];
	for (const skin of SKINS) {
		if (ownedSkinIds.has(skin.id)) {
			continue;
		}
		if (skin.unlockCondition.type === "default") {
			continue;
		}
		if (
			isSkinUnlocked(skin, {
				highestScore,
				highestDistance,
				gamesPlayed: playerRecord.gamesPlayed,
				achievementIds,
			})
		) {
			skinsToInsert.push(skin.id);
		}
	}

	if (skinsToInsert.length === 0) {
		return [];
	}

	// Batch insert, skip conflicts
	const inserted = await db
		.insert(playerSkin)
		.values(
			skinsToInsert.map((skinId) => ({
				id: crypto.randomUUID(),
				playerId,
				skinId,
				unlockedAt: now,
			})),
		)
		.onConflictDoNothing()
		.returning({ skinId: playerSkin.skinId });

	return (inserted ?? []).map((r) => r.skinId);
}

export function isSkinUnlocked(
	skin: SkinDefinition,
	stats: {
		highestScore: number;
		highestDistance: number;
		gamesPlayed: number;
		achievementIds: Set<string>;
	},
): boolean {
	const { unlockCondition } = skin;

	switch (unlockCondition.type) {
		case "default":
			return true;
		case "score":
			return stats.highestScore >= unlockCondition.threshold;
		case "distance":
			return stats.highestDistance >= unlockCondition.threshold;
		case "games_played":
			return stats.gamesPlayed >= unlockCondition.count;
		case "achievement":
			return stats.achievementIds.has(unlockCondition.achievementId);
		default:
			return false;
	}
}
