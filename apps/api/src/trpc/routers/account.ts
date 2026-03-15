import { eq } from "drizzle-orm";
import { z } from "zod";
import { player, user } from "../../db/schema.ts";
import { ensurePlayer } from "../../lib/ensure-player.ts";
import { protectedProcedure, router } from "../trpc.ts";

export const accountRouter = router({
	getAccountStatus: protectedProcedure.query(async ({ ctx }) => {
		const userRecord = await ctx.db
			.select({
				deletionRequestedAt: user.deletionRequestedAt,
				deletionScheduledFor: user.deletionScheduledFor,
			})
			.from(user)
			.where(eq(user.id, ctx.user.id))
			.get();

		return {
			deletionPending: !!userRecord?.deletionRequestedAt,
			deletionRequestedAt: userRecord?.deletionRequestedAt ?? null,
			deletionScheduledFor: userRecord?.deletionScheduledFor ?? null,
		};
	}),

	requestDeletion: protectedProcedure.mutation(async ({ ctx }) => {
		const now = Math.floor(Date.now() / 1000);
		const scheduledFor = now + 24 * 60 * 60; // 24 hours from now

		await ctx.db
			.update(user)
			.set({
				deletionRequestedAt: now,
				deletionScheduledFor: scheduledFor,
				updatedAt: new Date(),
			})
			.where(eq(user.id, ctx.user.id));

		return { deletionRequestedAt: now, deletionScheduledFor: scheduledFor };
	}),

	cancelDeletion: protectedProcedure.mutation(async ({ ctx }) => {
		await ctx.db
			.update(user)
			.set({
				deletionRequestedAt: null,
				deletionScheduledFor: null,
				updatedAt: new Date(),
			})
			.where(eq(user.id, ctx.user.id));

		return { success: true };
	}),

	getPrivacy: protectedProcedure.query(async ({ ctx }) => {
		const playerRecord = await ensurePlayer(ctx.db, ctx.user.id);
		if (!playerRecord) {
			return { profilePublic: true };
		}
		return { profilePublic: playerRecord.profilePublic === 1 };
	}),

	updatePrivacy: protectedProcedure
		.input(z.object({ profilePublic: z.boolean() }))
		.mutation(async ({ ctx, input }) => {
			const playerRecord = await ensurePlayer(ctx.db, ctx.user.id);
			if (!playerRecord) {
				return { profilePublic: input.profilePublic };
			}

			await ctx.db
				.update(player)
				.set({
					profilePublic: input.profilePublic ? 1 : 0,
					updatedAt: new Date(),
				})
				.where(eq(player.id, playerRecord.id));

			return { profilePublic: input.profilePublic };
		}),
});
