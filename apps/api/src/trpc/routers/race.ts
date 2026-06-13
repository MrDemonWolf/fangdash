import {
	MAX_DISTANCE_ABSOLUTE,
	MAX_DURATION_MS,
	MAX_OBSTACLES_ABSOLUTE,
	MAX_SCORE_ABSOLUTE,
	getLevelFromXp,
	getPlacementBonus,
} from "@fangdash/shared";
import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, gt, sql } from "drizzle-orm";
import { z } from "zod";
import { player, raceHistory } from "../../db/schema.ts";
import { checkAllUnlocks } from "../../lib/check-all-unlocks.ts";
import { ensurePlayer } from "../../lib/ensure-player.ts";
import { validateScoreInput } from "../../lib/validate-score.ts";
import { protectedProcedure, router } from "../trpc.ts";

export const raceRouter = router({
	submitResult: protectedProcedure
		.input(
			z.object({
				raceId: z.string().min(1).max(64),
				score: z.number().int().min(0).max(MAX_SCORE_ABSOLUTE),
				distance: z.number().min(0).max(MAX_DISTANCE_ABSOLUTE),
				duration: z.number().int().min(0).max(MAX_DURATION_MS),
				obstaclesCleared: z.number().int().min(0).max(MAX_OBSTACLES_ABSOLUTE),
				seed: z.string().min(1).max(64),
				cheated: z.boolean().default(false),
				mods: z.number().int().min(0).default(0),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const validation = validateScoreInput({
				mods: input.mods,
				duration: input.duration,
				score: input.score,
				obstaclesCleared: input.obstaclesCleared,
				distance: input.distance,
			});
			if (!validation.valid) {
				throw new TRPCError({ code: "BAD_REQUEST", message: validation.reason });
			}

			const playerRecord = await ensurePlayer(ctx.db, ctx.user.id);
			if (!playerRecord) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create player",
				});
			}

			const now = new Date();
			const raceHistoryId = crypto.randomUUID();

			// Compute this player's placement read-only: 1 + the number of rows in this
			// race that scored higher. We deliberately NEVER read or mutate OTHER players'
			// rows here — raceId is client-supplied and unauthenticated, so an attacker who
			// learns a foreign `roomId:seed` must not be able to demote real participants'
			// placement/XP/racesWon. Cross-player-authoritative ranking is the party
			// server's job; binding submissions to verified participation (signed race
			// result tokens) is tracked as a follow-up.
			const higher = await ctx.db
				.select({ c: count() })
				.from(raceHistory)
				.where(and(eq(raceHistory.raceId, input.raceId), gt(raceHistory.score, input.score)));
			const placement = (higher[0]?.c ?? 0) + 1;

			// Atomic dedupe via the (race_id, player_id) unique index: onConflictDoNothing
			// + empty returning ⇒ this player already submitted for this race. Avoids the
			// race window a separate SELECT pre-check would leave open.
			const inserted = await ctx.db
				.insert(raceHistory)
				.values({
					id: raceHistoryId,
					raceId: input.raceId,
					playerId: playerRecord.id,
					placement,
					score: input.score,
					distance: input.distance,
					seed: input.seed,
					cheated: input.cheated ? 1 : 0,
					mods: input.mods,
					createdAt: now,
				})
				.onConflictDoNothing({ target: [raceHistory.raceId, raceHistory.playerId] })
				.returning({ id: raceHistory.id });

			if (inserted.length === 0) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Result for this race was already submitted",
				});
			}

			if (input.cheated) {
				return {
					raceHistoryId,
					placement,
					newAchievements: [],
					newSkins: [],
					unlockError: false,
					xpGained: 0,
					levelUp: false,
					newLevel: playerRecord.level,
				};
			}

			// Award only this player's own XP/level/racesWon — no cross-player writes.
			const placementBonus = getPlacementBonus(placement);
			const xpGained = input.score + placementBonus;
			const previousLevel = playerRecord.level;

			const currentPlayerUpdate: Record<string, unknown> = {
				racesPlayed: sql`${player.racesPlayed} + 1`,
				totalXp: sql`${player.totalXp} + ${xpGained}`,
				updatedAt: now,
			};
			if (placement === 1) {
				currentPlayerUpdate["racesWon"] = sql`${player.racesWon} + 1`;
			}

			// Derive the level from the post-increment totalXp so it is never computed
			// from a stale read (the level write is last-writer-wins and self-heals next race).
			const updated = await ctx.db
				.update(player)
				.set(currentPlayerUpdate)
				.where(eq(player.id, playerRecord.id))
				.returning({ totalXp: player.totalXp });

			const newTotalXp = updated[0]?.totalXp ?? playerRecord.totalXp + xpGained;
			const levelInfo = getLevelFromXp(newTotalXp);

			await ctx.db
				.update(player)
				.set({ level: levelInfo.level })
				.where(eq(player.id, playerRecord.id));

			const { newAchievements, newSkins, unlockError } = await checkAllUnlocks(
				ctx.db,
				playerRecord.id,
				"race.submitResult",
				raceHistoryId,
				{
					score: input.score,
					distance: input.distance,
					obstaclesCleared: input.obstaclesCleared,
					longestCleanRun: 0,
				},
			);

			return {
				raceHistoryId,
				placement,
				newAchievements,
				newSkins,
				unlockError,
				xpGained,
				levelUp: levelInfo.level > previousLevel,
				newLevel: levelInfo.level,
			};
		}),

	getHistory: protectedProcedure.query(async ({ ctx }) => {
		const playerRecord = await ensurePlayer(ctx.db, ctx.user.id);
		if (!playerRecord) {
			return [];
		}

		return ctx.db
			.select({
				raceId: raceHistory.raceId,
				placement: raceHistory.placement,
				score: raceHistory.score,
				distance: raceHistory.distance,
				seed: raceHistory.seed,
				createdAt: raceHistory.createdAt,
			})
			.from(raceHistory)
			.where(sql`${raceHistory.playerId} = ${playerRecord.id} AND ${raceHistory.cheated} = 0`)
			.orderBy(desc(raceHistory.createdAt))
			.limit(20);
	}),

	getStats: protectedProcedure.query(async ({ ctx }) => {
		const playerRecord = await ensurePlayer(ctx.db, ctx.user.id);
		if (!playerRecord) {
			return { racesPlayed: 0, racesWon: 0 };
		}

		return {
			racesPlayed: playerRecord.racesPlayed,
			racesWon: playerRecord.racesWon,
		};
	}),
});
