import { getLevelFromXp, SKINS } from "@fangdash/shared";
import { TRPCError } from "@trpc/server";
import { count, desc, eq, like, sql } from "drizzle-orm";
import { z } from "zod";
import { player, playerSkin, raceHistory, score, user } from "../../db/schema.ts";
import { ensurePlayer } from "../../lib/ensure-player.ts";
import { devProcedure, router } from "../trpc.ts";

export const adminRouter = router({
	getStats: devProcedure.query(async ({ ctx }) => {
		const playerCountRows = await ctx.db.select({ count: count() }).from(player);
		const scoreStatsRows = await ctx.db
			.select({
				totalGames: count(),
				totalMeters: sql<number>`coalesce(sum(${score.distance}), 0)`,
			})
			.from(score);
		const raceStatsRows = await ctx.db
			.select({
				distinctRaces: sql<number>`count(distinct ${raceHistory.raceId})`,
				totalEntries: count(),
			})
			.from(raceHistory);

		const playerCount = playerCountRows[0] ?? { count: 0 };
		const scoreStats = scoreStatsRows[0] ?? { totalGames: 0, totalMeters: 0 };
		const raceStats = raceStatsRows[0] ?? { distinctRaces: 0, totalEntries: 0 };

		return {
			totalPlayers: playerCount.count,
			totalGamesPlayed: scoreStats.totalGames,
			totalMeters: Math.round(scoreStats.totalMeters),
			distinctRaces: raceStats.distinctRaces,
			totalRaceEntries: raceStats.totalEntries,
		};
	}),

	getPlayers: devProcedure
		.input(
			z.object({
				page: z.number().int().min(1).default(1),
				limit: z.number().int().min(1).max(100).default(20),
				search: z.string().optional(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const offset = (input.page - 1) * input.limit;
			const searchFilter = input.search ? like(user.name, `%${input.search}%`) : undefined;

			const [totalResult, rows] = await Promise.all([
				ctx.db
					.select({ count: count() })
					.from(user)
					.leftJoin(player, eq(user.id, player.userId))
					.where(searchFilter),
				ctx.db
					.select({
						id: user.id,
						name: user.name,
						role: user.role,
						banned: user.banned,
						banReason: user.banReason,
						banExpires: user.banExpires,
						createdAt: user.createdAt,
						gamesPlayed: player.gamesPlayed,
						totalDistance: player.totalDistance,
					})
					.from(user)
					.leftJoin(player, eq(user.id, player.userId))
					.where(searchFilter)
					.orderBy(desc(user.createdAt))
					.limit(input.limit)
					.offset(offset),
			]);

			return {
				items: rows,
				total: (totalResult[0] ?? { count: 0 }).count,
				page: input.page,
				limit: input.limit,
			};
		}),

	banUser: devProcedure
		.input(
			z.object({
				userId: z.string(),
				reason: z.string().optional(),
				durationDays: z.number().int().min(0).optional(), // 0 = permanent
			}),
		)
		.mutation(async ({ ctx, input }) => {
			if (!ctx.auth) {
				throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Auth not configured" });
			}
			const body: { userId: string; banReason?: string; banExpiresIn?: number } = {
				userId: input.userId,
			};
			if (input.reason) {
				body.banReason = input.reason;
			}
			if (input.durationDays && input.durationDays > 0) {
				body.banExpiresIn = input.durationDays * 24 * 60 * 60;
			}
			await ctx.auth.api.banUser({
				body,
				headers: ctx.headers,
			});

			return { success: true };
		}),

	unbanUser: devProcedure
		.input(z.object({ userId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			if (!ctx.auth) {
				throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Auth not configured" });
			}
			await ctx.auth.api.unbanUser({
				body: { userId: input.userId },
				headers: ctx.headers,
			});
			return { success: true };
		}),

	getScores: devProcedure
		.input(
			z.object({
				page: z.number().int().min(1).default(1),
				limit: z.number().int().min(1).max(100).default(20),
			}),
		)
		.query(async ({ ctx, input }) => {
			const offset = (input.page - 1) * input.limit;

			const [totalResult, rows] = await Promise.all([
				ctx.db.select({ count: count() }).from(score),
				ctx.db
					.select({
						id: score.id,
						score: score.score,
						distance: score.distance,
						obstaclesCleared: score.obstaclesCleared,
						duration: score.duration,
						seed: score.seed,
						createdAt: score.createdAt,
						playerId: score.playerId,
						playerName: user.name,
					})
					.from(score)
					.innerJoin(player, eq(score.playerId, player.id))
					.innerJoin(user, eq(player.userId, user.id))
					.orderBy(desc(score.createdAt))
					.limit(input.limit)
					.offset(offset),
			]);

			return {
				items: rows,
				total: (totalResult[0] ?? { count: 0 }).count,
				page: input.page,
				limit: input.limit,
			};
		}),

	deleteScore: devProcedure
		.input(z.object({ scoreId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.select().from(score).where(eq(score.id, input.scoreId)).get();

			if (!existing) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Score not found" });
			}

			await ctx.db.batch([
				ctx.db
					.update(player)
					.set({
						totalScore: sql`${player.totalScore} - ${existing.score}`,
						totalDistance: sql`${player.totalDistance} - ${existing.distance}`,
						totalObstaclesCleared: sql`${player.totalObstaclesCleared} - ${existing.obstaclesCleared}`,
						gamesPlayed: sql`MAX(0, ${player.gamesPlayed} - 1)`,
						totalXp: sql`MAX(0, ${player.totalXp} - ${existing.score})`,
						updatedAt: new Date(),
					})
					.where(eq(player.id, existing.playerId)),
				ctx.db.delete(score).where(eq(score.id, input.scoreId)),
			]);

			// Reconcile level from the atomically-updated XP
			const updated = await ctx.db
				.select({ totalXp: player.totalXp })
				.from(player)
				.where(eq(player.id, existing.playerId))
				.get();

			if (updated) {
				const newLevel = getLevelFromXp(updated.totalXp).level;
				await ctx.db
					.update(player)
					.set({ level: newLevel })
					.where(eq(player.id, existing.playerId));
			}

			return { success: true };
		}),

	getRaces: devProcedure
		.input(
			z.object({
				page: z.number().int().min(1).default(1),
				limit: z.number().int().min(1).max(100).default(20),
			}),
		)
		.query(async ({ ctx, input }) => {
			const offset = (input.page - 1) * input.limit;

			// Phase 1: count distinct races for total
			const totalRows = await ctx.db
				.select({ count: sql<number>`count(distinct ${raceHistory.raceId})` })
				.from(raceHistory);
			const totalResult = totalRows[0] ?? { count: 0 };

			// Phase 2: get paginated distinct raceIds
			const paginatedRaceIds = await ctx.db
				.selectDistinct({ raceId: raceHistory.raceId })
				.from(raceHistory)
				.orderBy(desc(sql`max(${raceHistory.createdAt})`))
				.groupBy(raceHistory.raceId)
				.limit(input.limit)
				.offset(offset);

			if (paginatedRaceIds.length === 0) {
				return {
					items: [],
					total: totalResult.count,
					page: input.page,
					limit: input.limit,
				};
			}

			// Phase 3: fetch all rows for those raceIds
			const raceIdValues = paginatedRaceIds.map((r) => r.raceId);
			const rows = await ctx.db
				.select({
					id: raceHistory.id,
					raceId: raceHistory.raceId,
					placement: raceHistory.placement,
					score: raceHistory.score,
					distance: raceHistory.distance,
					createdAt: raceHistory.createdAt,
					playerName: user.name,
				})
				.from(raceHistory)
				.innerJoin(player, eq(raceHistory.playerId, player.id))
				.innerJoin(user, eq(player.userId, user.id))
				.where(
					sql`${raceHistory.raceId} in (${sql.join(
						raceIdValues.map((id) => sql`${id}`),
						sql`, `,
					)})`,
				)
				.orderBy(desc(raceHistory.createdAt), raceHistory.placement);

			return {
				items: rows,
				total: totalResult.count,
				page: input.page,
				limit: input.limit,
			};
		}),

	unlockAllSkins: devProcedure.mutation(async ({ ctx }) => {
		const playerRecord = await ensurePlayer(ctx.db, ctx.user.id);
		if (!playerRecord) {
			throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to find player" });
		}

		const now = new Date();
		const values = SKINS.filter((s) => s.unlockCondition.type !== "default").map((s) => ({
			id: crypto.randomUUID(),
			playerId: playerRecord.id,
			skinId: s.id,
			unlockedAt: now,
		}));

		if (values.length > 0) {
			await ctx.db.insert(playerSkin).values(values).onConflictDoNothing();
		}

		return { unlockedCount: values.length };
	}),
});
