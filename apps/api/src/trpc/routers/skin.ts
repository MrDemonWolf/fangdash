import { DEFAULT_SKIN_ID, getSkinById, type SkinDefinition, SKINS } from "@fangdash/shared";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { player, playerSkin } from "../../db/schema.ts";
import { getUnlockedSkinIds } from "../../lib/get-unlocked-ids.ts";
import { getUnlockStats } from "../../lib/unlock-stats.ts";
import { playerProcedure, publicProcedure, router } from "../trpc.ts";

export const skinRouter = router({
	getUnlockedSkins: playerProcedure.query(async ({ ctx }) => {
		const skinIds = await getUnlockedSkinIds(ctx.db, ctx.playerRecord.id);
		return Array.from(skinIds);
	}),

	equipSkin: playerProcedure
		.input(z.object({ skinId: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const skin = getSkinById(input.skinId);
			if (!skin) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Skin not found" });
			}

			// Check skin is unlocked (default skin is always available)
			if (input.skinId !== DEFAULT_SKIN_ID) {
				const owned = await ctx.db
					.select()
					.from(playerSkin)
					.where(
						and(eq(playerSkin.playerId, ctx.playerRecord.id), eq(playerSkin.skinId, input.skinId)),
					)
					.get();

				if (!owned) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Skin not unlocked",
					});
				}
			}

			await ctx.db
				.update(player)
				.set({ equippedSkinId: input.skinId, updatedAt: new Date() })
				.where(eq(player.id, ctx.playerRecord.id));

			return { equippedSkinId: input.skinId };
		}),

	getEquippedSkin: playerProcedure.query(async ({ ctx }) => {
		return { skinId: ctx.playerRecord.equippedSkinId };
	}),

	gallery: playerProcedure.query(async ({ ctx }) => {
		const unlockedIds = await getUnlockedSkinIds(ctx.db, ctx.playerRecord.id);

		return SKINS.map((skin: SkinDefinition) => ({
			...skin,
			unlocked: unlockedIds.has(skin.id),
		}));
	}),

	getStats: publicProcedure.query(async ({ ctx }) => {
		return getUnlockStats(ctx.db, playerSkin, playerSkin.skinId);
	}),
});
