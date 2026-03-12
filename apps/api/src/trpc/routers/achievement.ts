import { ACHIEVEMENTS } from "@fangdash/shared/achievements";
import { eq } from "drizzle-orm";
import { playerAchievement } from "../../db/schema.ts";
import { ensurePlayer } from "../../lib/ensure-player.ts";
import { protectedProcedure, publicProcedure, router } from "../trpc.ts";

export const achievementRouter = router({
	/**
	 * Get all achievements with the current user's unlock status.
	 */
	getAll: protectedProcedure.query(async ({ ctx }) => {
		const playerRecord = await ensurePlayer(ctx.db, ctx.user.id);
		if (!playerRecord) {
			return ACHIEVEMENTS.map((a) => ({
				...a,
				unlocked: false,
				unlockedAt: null,
			}));
		}

		const unlocked = await ctx.db
			.select({
				achievementId: playerAchievement.achievementId,
				unlockedAt: playerAchievement.unlockedAt,
			})
			.from(playerAchievement)
			.where(eq(playerAchievement.playerId, playerRecord.id));

		const unlockedMap = new Map(
			unlocked.map((u) => [u.achievementId, u.unlockedAt]),
		);

		return ACHIEVEMENTS.map((a) => ({
			...a,
			unlocked: unlockedMap.has(a.id),
			unlockedAt: unlockedMap.get(a.id) ?? null,
		}));
	}),

	/**
	 * Get only the user's unlocked achievements with timestamps.
	 */
	getMine: protectedProcedure.query(async ({ ctx }) => {
		const playerRecord = await ensurePlayer(ctx.db, ctx.user.id);
		if (!playerRecord) {
			return [];
		}

		const unlocked = await ctx.db
			.select({
				achievementId: playerAchievement.achievementId,
				unlockedAt: playerAchievement.unlockedAt,
			})
			.from(playerAchievement)
			.where(eq(playerAchievement.playerId, playerRecord.id));

		return unlocked
			.map((u) => {
				const definition = ACHIEVEMENTS.find((a) => a.id === u.achievementId);
				if (!definition) {
					return null;
				}
				return {
					...definition,
					unlockedAt: u.unlockedAt,
				};
			})
			.filter(Boolean);
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
});
