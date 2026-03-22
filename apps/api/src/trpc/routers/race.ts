import { getLevelFromXp, getPlacementBonus } from "@fangdash/shared";
import { TRPCError } from "@trpc/server";
import { desc, eq, inArray, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { z } from "zod";
import { player, raceHistory } from "../../db/schema.ts";
import { checkAchievements } from "../../lib/achievement-checker.ts";
import { ensurePlayer } from "../../lib/ensure-player.ts";
import { checkSkinUnlocks } from "../../lib/skin-unlocker.ts";
import { protectedProcedure, router } from "../trpc.ts";

export const raceRouter = router({
	submitResult: protectedProcedure
		.input(
			z.object({
				raceId: z.string().min(1),
				score: z.number().int().min(0),
				distance: z.number().min(0),
				seed: z.string().min(1),
				cheated: z.boolean().default(false),
				mods: z.number().int().min(0).default(0),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const playerRecord = await ensurePlayer(ctx.db, ctx.user.id);
			if (!playerRecord) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create player",
				});
			}

			const now = new Date();
			const raceHistoryId = crypto.randomUUID();

			// Insert with placeholder placement (recomputed below)
			const provisionalPlacement = 0;

			await ctx.db.insert(raceHistory).values({
				id: raceHistoryId,
				raceId: input.raceId,
				playerId: playerRecord.id,
				placement: provisionalPlacement,
				score: input.score,
				distance: input.distance,
				seed: input.seed,
				cheated: input.cheated ? 1 : 0,
				mods: input.mods,
				createdAt: now,
			});

			// Phase 1: Compute authoritative placements for ALL rows in this race
			const allResults = await ctx.db
				.select({
					id: raceHistory.id,
					playerId: raceHistory.playerId,
					placement: raceHistory.placement,
					score: raceHistory.score,
				})
				.from(raceHistory)
				.where(eq(raceHistory.raceId, input.raceId))
				.orderBy(desc(raceHistory.score));

			let placement = provisionalPlacement;
			const placementChanges: {
				id: string;
				playerId: string;
				oldPlacement: number;
				newPlacement: number;
			}[] = [];

			for (let i = 0; i < allResults.length; i++) {
				const row = allResults[i];
				if (!row) continue;
				const newPlacement = i + 1;
				if (row.id === raceHistoryId) {
					placement = newPlacement;
				}
				if (row.placement !== newPlacement) {
					placementChanges.push({
						id: row.id,
						playerId: row.playerId,
						oldPlacement: row.placement,
						newPlacement,
					});
				}
			}

			// If cheated, only update placements (other players' ranks still matter) but skip rewards
			if (input.cheated) {
				// Still apply placement corrections for other players
				if (placementChanges.length > 0) {
					const batchStmts: BatchItem<"sqlite">[] = placementChanges.map(
						(change) =>
							ctx.db
								.update(raceHistory)
								.set({ placement: change.newPlacement })
								.where(eq(raceHistory.id, change.id)),
					);
					await ctx.db.batch(
						batchStmts as unknown as [
							BatchItem<"sqlite">,
							...BatchItem<"sqlite">[],
						],
					);
				}
				return {
					raceHistoryId,
					placement,
					newAchievements: [],
					newSkins: [],
					achievementError: false,
					xpGained: 0,
					levelUp: false,
					newLevel: playerRecord.level,
				};
			}

			// Phase 2: Fetch affected OTHER players and compute XP/racesWon deltas
			const otherAffected = placementChanges.filter(
				(c) => c.playerId !== playerRecord.id,
			);
			let otherPlayerRecords: {
				id: string;
				totalXp: number;
				racesWon: number;
			}[] = [];

			if (otherAffected.length > 0) {
				const affectedPlayerIds = [
					...new Set(otherAffected.map((c) => c.playerId)),
				];
				otherPlayerRecords = await ctx.db
					.select({
						id: player.id,
						totalXp: player.totalXp,
						racesWon: player.racesWon,
					})
					.from(player)
					.where(inArray(player.id, affectedPlayerIds));
			}

			// Phase 3: Compute current player's XP
			const placementBonus = getPlacementBonus(placement);
			const xpGained = input.score + placementBonus;
			const newTotalXp = playerRecord.totalXp + xpGained;
			const levelInfo = getLevelFromXp(newTotalXp);
			const previousLevel = playerRecord.level;

			// Phase 4: Build batch writes
			const batchStatements: BatchItem<"sqlite">[] = [];

			// 4a: Update changed raceHistory placements
			for (const change of placementChanges) {
				batchStatements.push(
					ctx.db
						.update(raceHistory)
						.set({ placement: change.newPlacement })
						.where(eq(raceHistory.id, change.id)),
				);
			}

			// 4b: Update affected OTHER players' XP, level, racesWon
			for (const other of otherAffected) {
				const record = otherPlayerRecords.find((r) => r.id === other.playerId);
				if (!record) continue;

				const xpDelta =
					getPlacementBonus(other.newPlacement) -
					getPlacementBonus(other.oldPlacement);
				const adjustedTotalXp = Math.max(0, record.totalXp + xpDelta);
				const adjustedLevel = getLevelFromXp(adjustedTotalXp).level;
				const racesWonDelta =
					(other.oldPlacement === 1 ? -1 : 0) +
					(other.newPlacement === 1 ? 1 : 0);

				batchStatements.push(
					ctx.db
						.update(player)
						.set({
							totalXp: adjustedTotalXp,
							level: adjustedLevel,
							racesWon:
								racesWonDelta !== 0
									? sql`MAX(0, ${player.racesWon} + ${racesWonDelta})`
									: record.racesWon,
							updatedAt: now,
						})
						.where(eq(player.id, other.playerId)),
				);
			}

			// 4c: Update current player
			const currentPlayerUpdate: Record<string, unknown> = {
				racesPlayed: sql`${player.racesPlayed} + 1`,
				totalXp: sql`${player.totalXp} + ${xpGained}`,
				level: levelInfo.level,
				updatedAt: now,
			};

			if (placement === 1) {
				currentPlayerUpdate["racesWon"] = sql`${player.racesWon} + 1`;
			}

			batchStatements.push(
				ctx.db
					.update(player)
					.set(currentPlayerUpdate)
					.where(eq(player.id, playerRecord.id)),
			);

			// Phase 5: Execute atomically
			await ctx.db.batch(
				batchStatements as unknown as [
					BatchItem<"sqlite">,
					...BatchItem<"sqlite">[],
				],
			);

			let newAchievements: string[] = [];
			const newSkins: string[] = [];
			let achievementError = false;

			// Block 1: achievements
			let checkStats:
				| import("../../lib/achievement-checker.ts").CheckStats
				| undefined;
			try {
				const achievementResult = await checkAchievements(
					ctx.db,
					playerRecord.id,
					{
						score: input.score,
						distance: input.distance,
						obstaclesCleared: 0,
						longestCleanRun: 0,
					},
				);
				newAchievements = achievementResult.newAchievements;
				newSkins.push(...achievementResult.newSkins);
				checkStats = achievementResult.stats;
			} catch (err) {
				console.error("[race.submitResult] Achievement check failed", {
					playerId: playerRecord.id,
					raceHistoryId,
					error: err,
				});
				achievementError = true;
			}

			// Block 2: skins (independent — achievement failure doesn't block this)
			try {
				const skinUnlocks = await checkSkinUnlocks(
					ctx.db,
					playerRecord.id,
					checkStats,
				);
				newSkins.push(...skinUnlocks);
			} catch (err) {
				console.error("[race.submitResult] Skin unlock check failed", {
					playerId: playerRecord.id,
					raceHistoryId,
					error: err,
				});
				achievementError = true;
			}

			return {
				raceHistoryId,
				placement,
				newAchievements,
				newSkins,
				achievementError,
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
			.where(
				sql`${raceHistory.playerId} = ${playerRecord.id} AND ${raceHistory.cheated} = 0`,
			)
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
