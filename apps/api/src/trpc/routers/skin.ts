import { getSkinById, type SkinDefinition, SKINS } from "@fangdash/shared";
import { TRPCError } from "@trpc/server";
import { and, count, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { player, playerSkin } from "../../db/schema.ts";
import { ensurePlayer } from "../../lib/ensure-player.ts";
import { protectedProcedure, publicProcedure, router } from "../trpc.ts";

export const skinRouter = router({
	getUnlockedSkins: protectedProcedure.query(async ({ ctx }) => {
		const playerRecord = await ensurePlayer(ctx.db, ctx.user.id);
		if (!playerRecord) {
			return ["gray-wolf"];
		}

		const unlocked = await ctx.db
			.select({ skinId: playerSkin.skinId })
			.from(playerSkin)
			.where(eq(playerSkin.playerId, playerRecord.id));

		// Always include the default skin
		const skinIds = new Set(unlocked.map((r) => r.skinId));
		skinIds.add("gray-wolf");

		return Array.from(skinIds);
	}),

	equipSkin: protectedProcedure
		.input(z.object({ skinId: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const skin = getSkinById(input.skinId);
			if (!skin) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Skin not found" });
			}

			const playerRecord = await ensurePlayer(ctx.db, ctx.user.id);
			if (!playerRecord) {
				throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
			}

			// Check skin is unlocked (default skin is always available)
			if (input.skinId !== "gray-wolf") {
				const owned = await ctx.db
					.select()
					.from(playerSkin)
					.where(and(eq(playerSkin.playerId, playerRecord.id), eq(playerSkin.skinId, input.skinId)))
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
				.where(eq(player.id, playerRecord.id));

			return { equippedSkinId: input.skinId };
		}),

	getEquippedSkin: protectedProcedure.query(async ({ ctx }) => {
		const playerRecord = await ensurePlayer(ctx.db, ctx.user.id);
		if (!playerRecord) {
			return { skinId: "gray-wolf" };
		}

		return { skinId: playerRecord.equippedSkinId };
	}),

	gallery: protectedProcedure.query(async ({ ctx }) => {
		const playerRecord = await ensurePlayer(ctx.db, ctx.user.id);
		const unlockedIds = new Set<string>(["gray-wolf"]);

		if (playerRecord) {
			const unlocked = await ctx.db
				.select({ skinId: playerSkin.skinId })
				.from(playerSkin)
				.where(eq(playerSkin.playerId, playerRecord.id));

			for (const r of unlocked) {
				unlockedIds.add(r.skinId);
			}
		}

		return SKINS.map((skin: SkinDefinition) => ({
			...skin,
			unlocked: unlockedIds.has(skin.id),
		}));
	}),

	getStats: publicProcedure.query(async ({ ctx }) => {
		const [totalPlayersResult, unlockCounts] = await Promise.all([
			ctx.db.select({ total: count() }).from(player),
			ctx.db
				.select({
					skinId: playerSkin.skinId,
					unlockCount: sql<number>`count(*)`,
				})
				.from(playerSkin)
				.groupBy(playerSkin.skinId),
		]);

		const totalPlayers = totalPlayersResult[0]?.total ?? 0;
		const result: Record<string, { unlockCount: number; totalPlayers: number }> = {};

		for (const row of unlockCounts) {
			result[row.skinId] = {
				unlockCount: row.unlockCount,
				totalPlayers,
			};
		}

		return result;
	}),
});
