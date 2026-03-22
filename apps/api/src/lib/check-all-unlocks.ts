import type { DrizzleD1Database } from "drizzle-orm/d1";
import type * as schema from "../db/schema.ts";
import { type CheckStats, checkAchievements } from "./achievement-checker.ts";
import { checkSkinUnlocks } from "./skin-unlocker.ts";

interface UnlockResult {
	newAchievements: string[];
	newSkins: string[];
	unlockError: boolean;
	stats?: CheckStats | undefined;
}

/**
 * Runs achievement + skin unlock checks for a player after a score/race submission.
 * Consolidates the duplicated try/catch blocks from score and race routers.
 */
export async function checkAllUnlocks(
	db: DrizzleD1Database<typeof schema>,
	playerId: string,
	logPrefix: string,
	contextId: string,
	latestScore?: {
		score: number;
		distance: number;
		obstaclesCleared: number;
		longestCleanRun?: number;
		duration?: number;
		mods?: number;
	},
): Promise<UnlockResult> {
	let newAchievements: string[] = [];
	const newSkins: string[] = [];
	let unlockError = false;
	let checkStats: CheckStats | undefined;

	// Block 1: achievements
	try {
		const achievementResult = await checkAchievements(db, playerId, latestScore);
		newAchievements = achievementResult.newAchievements;
		newSkins.push(...achievementResult.newSkins);
		checkStats = achievementResult.stats;
	} catch (err) {
		console.error(`[${logPrefix}] Achievement check failed`, {
			playerId,
			contextId,
			error: err,
		});
		unlockError = true;
	}

	// Block 2: skins (independent — achievement failure doesn't block this)
	try {
		const skinUnlocks = await checkSkinUnlocks(db, playerId, checkStats);
		newSkins.push(...skinUnlocks);
	} catch (err) {
		console.error(`[${logPrefix}] Skin unlock check failed`, {
			playerId,
			contextId,
			error: err,
		});
		unlockError = true;
	}

	return { newAchievements, newSkins, unlockError, stats: checkStats };
}
