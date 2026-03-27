import { ACHIEVEMENTS } from "@fangdash/shared/achievements";
import { eq } from "drizzle-orm";
import { playerAchievement } from "../../db/schema.ts";
import { ensurePlayer } from "../../lib/ensure-player.ts";
import { getUnlockStats } from "../../lib/unlock-stats.ts";
import { playerProcedure, publicProcedure, router } from "../trpc.ts";

export const achievementRouter = router({
	/**
	 * Get all achievements with the current user's unlock status.
	 */
	getAll: publicProcedure.query(async ({ ctx }) => {
		let unlockedMap = new Map<string, Date>();

		if (ctx.session?.userId) {
			try {
				const playerRecord = await ensurePlayer(ctx.db, ctx.session.userId);
				if (playerRecord) {
					const unlocked = await ctx.db
						.select({
							achievementId: playerAchievement.achievementId,
							unlockedAt: playerAchievement.unlockedAt,
						})
						.from(playerAchievement)
						.where(eq(playerAchievement.playerId, playerRecord.id));

					unlockedMap = new Map(unlocked.map((u) => [u.achievementId, u.unlockedAt]));
				}
			} catch (err) {
				console.error("[achievement.getAll]", err instanceof Error ? err.message : err);
				// Fall through with empty unlock map
			}
		}

		return ACHIEVEMENTS.map((a) => ({
			...a,
			unlocked: unlockedMap.has(a.id),
			unlockedAt: unlockedMap.get(a.id) ?? null,
		}));
	}),

	/**
	 * Get only the user's unlocked achievements with timestamps.
	 */
	getMine: playerProcedure.query(async ({ ctx }) => {
		const unlocked = await ctx.db
			.select({
				achievementId: playerAchievement.achievementId,
				unlockedAt: playerAchievement.unlockedAt,
			})
			.from(playerAchievement)
			.where(eq(playerAchievement.playerId, ctx.playerRecord.id));

		const achievementMap = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

		return unlocked.flatMap((u) => {
			const definition = achievementMap.get(u.achievementId);
			if (!definition) return [];
			return [{ ...definition, unlockedAt: u.unlockedAt }];
		});
	}),

	/**
	 * Public list of all achievement definitions (no user context needed).
	 */
	list: publicProcedure.query(() => {
		return ACHIEVEMENTS.map((a) => ({
			id: a.id,
			name: a.name,
			description: a.description,
			category: a.category,
			icon: a.icon,
			rewardSkinId: a.rewardSkinId ?? null,
		}));
	}),

	getStats: publicProcedure.query(async ({ ctx }) => {
		return getUnlockStats(ctx.db, playerAchievement, playerAchievement.achievementId);
	}),
});
