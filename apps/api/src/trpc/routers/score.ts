import {
	DIFFICULTY_NAMES,
	SCORE_PER_OBSTACLE,
	SCORE_PER_SECOND,
	getLevelFromXp,
} from "@fangdash/shared";
import { TRPCError } from "@trpc/server";
import { count, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { player, score, user } from "../../db/schema.ts";
import { checkAchievements } from "../../lib/achievement-checker.ts";
import { ensurePlayer } from "../../lib/ensure-player.ts";
import { checkSkinUnlocks } from "../../lib/skin-unlocker.ts";
import { protectedProcedure, publicProcedure, router } from "../trpc.ts";

export const scoreRouter = router({
	submit: protectedProcedure
		.input(
			z.object({
				score: z.number().int().min(0),
				distance: z.number().min(0),
				obstaclesCleared: z.number().int().min(0),
				longestCleanRun: z.number().min(0).default(0),
				duration: z.number().int().min(0),
				seed: z.string().min(1),
				difficulty: z.enum(DIFFICULTY_NAMES).default("easy"),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Anti-cheat: reject impossible scores
			const maxAllowedScore =
				(input.duration / 1000) * SCORE_PER_SECOND + input.obstaclesCleared * SCORE_PER_OBSTACLE;
			// Reject sessions longer than 30 minutes (1,800,000ms)
			if (input.duration > 1_800_000) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Game session exceeds maximum allowed duration",
				});
			}

			if (input.score > maxAllowedScore * 1.02) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Score exceeds maximum allowed rate",
				});
			}

			const playerRecord = await ensurePlayer(ctx.db, ctx.user.id);
			if (!playerRecord) {
				throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create player" });
			}

			const now = new Date();
			const scoreId = crypto.randomUUID();

			await ctx.db.insert(score).values({
				id: scoreId,
				playerId: playerRecord.id,
				score: input.score,
				distance: input.distance,
				obstaclesCleared: input.obstaclesCleared,
				longestCleanRun: input.longestCleanRun,
				duration: input.duration,
				difficulty: input.difficulty,
				seed: input.seed,
				createdAt: now,
			});

			// Update player aggregate stats, XP, and level atomically
			const newTotalXp = playerRecord.totalXp + input.score;
			const levelInfo = getLevelFromXp(newTotalXp);
			const previousLevel = playerRecord.level;

			await ctx.db
				.update(player)
				.set({
					totalScore: sql`${player.totalScore} + ${input.score}`,
					totalDistance: sql`${player.totalDistance} + ${input.distance}`,
					totalObstaclesCleared: sql`${player.totalObstaclesCleared} + ${input.obstaclesCleared}`,
					gamesPlayed: sql`${player.gamesPlayed} + 1`,
					totalXp: sql`${player.totalXp} + ${input.score}`,
					level: levelInfo.level,
					updatedAt: now,
				})
				.where(eq(player.id, playerRecord.id));

			let newAchievements: string[] = [];
			const newSkins: string[] = [];
			let achievementError = false;

			// Block 1: achievements
			let checkStats: import("../../lib/achievement-checker.ts").CheckStats | undefined;
			try {
				const achievementResult = await checkAchievements(ctx.db, playerRecord.id, {
					score: input.score,
					distance: input.distance,
					obstaclesCleared: input.obstaclesCleared,
					longestCleanRun: input.longestCleanRun,
				});
				newAchievements = achievementResult.newAchievements;
				newSkins.push(...achievementResult.newSkins);
				checkStats = achievementResult.stats;
			} catch (err) {
				console.error("[score.submit] Achievement check failed", {
					playerId: playerRecord.id,
					scoreId,
					error: err,
				});
				achievementError = true;
			}

			// Block 2: skins (independent — achievement failure doesn't block this)
			try {
				const skinUnlocks = await checkSkinUnlocks(ctx.db, playerRecord.id, checkStats);
				newSkins.push(...skinUnlocks);
			} catch (err) {
				console.error("[score.submit] Skin unlock check failed", {
					playerId: playerRecord.id,
					scoreId,
					error: err,
				});
				achievementError = true;
			}

			return {
				scoreId,
				newAchievements,
				newSkins,
				achievementError,
				xpGained: input.score,
				levelUp: levelInfo.level > previousLevel,
				newLevel: levelInfo.level,
			};
		}),

	leaderboard: publicProcedure
		.input(
			z
				.object({
					limit: z.number().int().min(1).max(100).default(50),
					period: z.enum(["daily", "weekly", "all"]).default("all"),
					difficulty: z.enum(DIFFICULTY_NAMES).optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const limit = input?.limit ?? 50;
			const period = input?.period ?? "all";
			const difficulty = input?.difficulty;

			const cutoff =
				period === "daily"
					? new Date(Date.now() - 24 * 60 * 60 * 1000)
					: period === "weekly"
						? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
						: null;

			const cutoffTs = cutoff ? Math.floor(cutoff.getTime() / 1000) : null;

			const diffFilter = difficulty ? sql` AND s2.difficulty = ${difficulty}` : sql``;
			const outerDiffFilter = difficulty ? sql` AND ${score.difficulty} = ${difficulty}` : sql``;
			const cutoffFilter = cutoffTs !== null ? sql` AND s2.created_at >= ${cutoffTs}` : sql``;
			const outerCutoffFilter =
				cutoffTs !== null ? sql` AND ${score.createdAt} >= ${cutoffTs}` : sql``;

			const rows = await ctx.db
				.select({
					scoreId: score.id,
					score: score.score,
					distance: score.distance,
					difficulty: score.difficulty,
					playerId: player.id,
					username: user.name,
					skinId: player.equippedSkinId,
					level: player.level,
					createdAt: score.createdAt,
				})
				.from(score)
				.innerJoin(player, eq(score.playerId, player.id))
				.innerJoin(user, eq(player.userId, user.id))
				.where(
					sql`${score.id} = (
						SELECT s2.id FROM score s2
						WHERE s2.player_id = ${score.playerId}${diffFilter}${cutoffFilter}
						ORDER BY s2.score DESC, s2.created_at DESC
						LIMIT 1
					)${outerDiffFilter}${outerCutoffFilter}`,
				)
				.orderBy(desc(score.score))
				.limit(limit);

			return rows.map((row, index) => ({
				rank: index + 1,
				...row,
			}));
		}),

	getPlayerStats: protectedProcedure.query(async ({ ctx }) => {
		const playerRecord = await ensurePlayer(ctx.db, ctx.user.id);
		if (!playerRecord) {
			return null;
		}

		return {
			gamesPlayed: playerRecord.gamesPlayed,
			totalScore: playerRecord.totalScore,
			totalDistance: playerRecord.totalDistance,
			totalObstaclesCleared: playerRecord.totalObstaclesCleared,
			totalXp: playerRecord.totalXp,
			level: playerRecord.level,
		};
	}),

	getGlobalStats: publicProcedure.query(async ({ ctx }) => {
		const result = await ctx.db
			.select({
				totalPlayers: count(),
				totalMeters: sql<number>`coalesce(sum(${player.totalDistance}), 0)`,
			})
			.from(player);
		const row = result[0] ?? { totalPlayers: 0, totalMeters: 0 };
		return {
			totalPlayers: row.totalPlayers,
			totalMeters: Math.round(row.totalMeters),
		};
	}),

	myScores: protectedProcedure.query(async ({ ctx }) => {
		const playerRecord = await ensurePlayer(ctx.db, ctx.user.id);
		if (!playerRecord) {
			return [];
		}

		return ctx.db
			.select()
			.from(score)
			.where(eq(score.playerId, playerRecord.id))
			.orderBy(desc(score.createdAt))
			.limit(20);
	}),
});
