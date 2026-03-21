import {
	ACHIEVEMENTS,
	DIFFICULTY_NAMES,
	READY_MODS_MASK,
	SCORE_PER_OBSTACLE,
	SCORE_PER_SECOND,
	areModsCompatible,
	getScoreMultiplier,
	getLevelFromXp,
	getSkinById,
} from "@fangdash/shared";
import { TRPCError } from "@trpc/server";
import { count, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { player, playerAchievement, playerSkin, score, user } from "../../db/schema.ts";
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
				seed: z.string().min(1).max(64),
				difficulty: z.enum(DIFFICULTY_NAMES).default("easy"),
				mods: z.number().int().min(0).default(0),
				cheated: z.boolean().default(false),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Validate mods bitmask: only allow ready, compatible mods
			if ((input.mods & ~READY_MODS_MASK) !== 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Invalid mod flags: contains non-ready mods",
				});
			}
			if (!areModsCompatible(input.mods)) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Invalid mod flags: incompatible mod combination",
				});
			}

			// Reject sessions longer than 30 minutes (1,800,000ms)
			if (input.duration > 1_800_000) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Game session exceeds maximum allowed duration",
				});
			}

			// Anti-cheat: reject impossible scores (account for mod score multipliers)
			// Tolerance: 10% + 50 flat buffer to absorb frame-timing drift between
			// the game's per-frame accumulation and the server's integer formula.
			const modMultiplier = getScoreMultiplier(input.mods);
			const maxAllowedScore =
				((input.duration / 1000) * SCORE_PER_SECOND + input.obstaclesCleared * SCORE_PER_OBSTACLE) *
				modMultiplier;

			if (input.score > maxAllowedScore * 1.1 + 50) {
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

			const isCheated = input.cheated ? 1 : 0;

			await ctx.db.insert(score).values({
				id: scoreId,
				playerId: playerRecord.id,
				score: input.score,
				distance: input.distance,
				obstaclesCleared: input.obstaclesCleared,
				longestCleanRun: input.longestCleanRun,
				duration: input.duration,
				difficulty: input.difficulty,
				mods: input.mods,
				seed: input.seed,
				cheated: isCheated,
				createdAt: now,
			});

			// If cheated, skip all rewards and stat updates
			if (input.cheated) {
				return {
					scoreId,
					newAchievements: [],
					newSkins: [],
					achievementError: false,
					xpGained: 0,
					levelUp: false,
					newLevel: playerRecord.level,
				};
			}

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
					mods: z.number().int().min(0).optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			const limit = input?.limit ?? 50;
			const period = input?.period ?? "all";
			const difficulty = input?.difficulty;
			const mods = input?.mods;

			const cutoff =
				period === "daily"
					? new Date(Date.now() - 24 * 60 * 60 * 1000)
					: period === "weekly"
						? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
						: null;

			const cutoffTs = cutoff ? Math.floor(cutoff.getTime() / 1000) : null;

			const diffFilter = difficulty ? sql` AND s2.difficulty = ${difficulty}` : sql``;
			const outerDiffFilter = difficulty ? sql` AND ${score.difficulty} = ${difficulty}` : sql``;
			// When filtering by a specific mod value, match exactly.
			// When showing "All" (mods undefined), exclude scores with non-ready mods.
			const readyMask = READY_MODS_MASK;
			const modsFilter =
				mods !== undefined ? sql` AND s2.mods = ${mods}` : sql` AND (s2.mods & ~${readyMask}) = 0`;
			const outerModsFilter =
				mods !== undefined
					? sql` AND ${score.mods} = ${mods}`
					: sql` AND (${score.mods} & ~${readyMask}) = 0`;
			const cutoffFilter = cutoffTs !== null ? sql` AND s2.created_at >= ${cutoffTs}` : sql``;
			const outerCutoffFilter =
				cutoffTs !== null ? sql` AND ${score.createdAt} >= ${cutoffTs}` : sql``;
			const cheatedFilter = sql` AND s2.cheated = 0`;
			const outerCheatedFilter = sql` AND ${score.cheated} = 0`;

			const rows = await ctx.db
				.select({
					scoreId: score.id,
					score: score.score,
					distance: score.distance,
					difficulty: score.difficulty,
					mods: score.mods,
					playerId: player.id,
					userId: user.id,
					username: user.name,
					userImage: user.image,
					skinId: player.equippedSkinId,
					level: player.level,
					profilePublic: player.profilePublic,
					createdAt: score.createdAt,
				})
				.from(score)
				.innerJoin(player, eq(score.playerId, player.id))
				.innerJoin(user, eq(player.userId, user.id))
				.where(
					sql`${score.id} = (
						SELECT s2.id FROM score s2
						WHERE s2.player_id = ${score.playerId}${diffFilter}${modsFilter}${cutoffFilter}${cheatedFilter}
						ORDER BY s2.score DESC, s2.created_at DESC
						LIMIT 1
					)${outerDiffFilter}${outerModsFilter}${outerCutoffFilter}${outerCheatedFilter}`,
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

	batchSync: protectedProcedure
		.input(
			z.object({
				scores: z
					.array(
						z.object({
							score: z.number().int().min(0),
							distance: z.number().min(0),
							obstaclesCleared: z.number().int().min(0),
							longestCleanRun: z.number().min(0).default(0),
							duration: z.number().int().min(0),
							seed: z.string().min(1).max(64),
							difficulty: z.enum(DIFFICULTY_NAMES).default("easy"),
							mods: z.number().int().min(0).default(0),
							cheated: z.boolean().default(false),
							clientTimestamp: z.number().int().min(0),
						}),
					)
					.max(20),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const playerRecord = await ensurePlayer(ctx.db, ctx.user.id);
			if (!playerRecord) {
				throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create player" });
			}

			const now = Date.now();
			const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
			const results: Array<{ clientIndex: number; scoreId?: string; status: "ok" | "rejected"; reason?: string }> = [];

			let totalXpGained = 0;
			const insertedScoreIds: string[] = [];
			const seenSeeds = new Set<string>();

			for (let i = 0; i < input.scores.length; i++) {
				const s = input.scores[i]!;

				// Reject duplicate seeds within the same batch
				const dedupKey = `${s.seed}:${s.clientTimestamp}`;
				if (seenSeeds.has(dedupKey)) {
					results.push({ clientIndex: i, status: "rejected", reason: "Duplicate score in batch" });
					continue;
				}
				seenSeeds.add(dedupKey);

				// Reject future or expired timestamps
				if (s.clientTimestamp > now + 60_000) {
					results.push({ clientIndex: i, status: "rejected", reason: "Timestamp in the future" });
					continue;
				}
				if (now - s.clientTimestamp > sevenDaysMs) {
					results.push({ clientIndex: i, status: "rejected", reason: "Score older than 7 days" });
					continue;
				}

				// Validate mods
				if ((s.mods & ~READY_MODS_MASK) !== 0 || !areModsCompatible(s.mods)) {
					results.push({ clientIndex: i, status: "rejected", reason: "Invalid mod flags" });
					continue;
				}

				// Duration cap
				if (s.duration > 1_800_000) {
					results.push({ clientIndex: i, status: "rejected", reason: "Duration exceeds maximum" });
					continue;
				}

				// Anti-cheat score bounds (10% + 50 flat buffer for frame-timing drift)
				const modMultiplier = getScoreMultiplier(s.mods);
				const maxAllowedScore =
					((s.duration / 1000) * SCORE_PER_SECOND + s.obstaclesCleared * SCORE_PER_OBSTACLE) *
					modMultiplier;
				if (s.score > maxAllowedScore * 1.1 + 50) {
					results.push({ clientIndex: i, status: "rejected", reason: "Score exceeds maximum allowed rate" });
					continue;
				}

				const scoreId = crypto.randomUUID();
				const isCheated = s.cheated ? 1 : 0;

				await ctx.db.insert(score).values({
					id: scoreId,
					playerId: playerRecord.id,
					score: s.score,
					distance: s.distance,
					obstaclesCleared: s.obstaclesCleared,
					longestCleanRun: s.longestCleanRun,
					duration: s.duration,
					difficulty: s.difficulty,
					mods: s.mods,
					seed: s.seed,
					cheated: isCheated,
					createdAt: new Date(s.clientTimestamp),
				});

				insertedScoreIds.push(scoreId);
				if (!s.cheated) {
					totalXpGained += s.score;
				}
				results.push({ clientIndex: i, scoreId, status: "ok" });
			}

			// Single aggregate XP/stats update for all non-cheated scores
			if (totalXpGained > 0) {
				const nonCheated = input.scores.filter((s) => !s.cheated);
				const totalDistance = nonCheated.reduce((sum, s) => sum + s.distance, 0);
				const totalObstacles = nonCheated.reduce((sum, s) => sum + s.obstaclesCleared, 0);
				const gamesCount = nonCheated.length;

				const newTotalXp = playerRecord.totalXp + totalXpGained;
				const levelInfo = getLevelFromXp(newTotalXp);

				await ctx.db
					.update(player)
					.set({
						totalScore: sql`${player.totalScore} + ${nonCheated.reduce((sum, s) => sum + s.score, 0)}`,
						totalDistance: sql`${player.totalDistance} + ${totalDistance}`,
						totalObstaclesCleared: sql`${player.totalObstaclesCleared} + ${totalObstacles}`,
						gamesPlayed: sql`${player.gamesPlayed} + ${gamesCount}`,
						totalXp: sql`${player.totalXp} + ${totalXpGained}`,
						level: levelInfo.level,
						updatedAt: new Date(),
					})
					.where(eq(player.id, playerRecord.id));
			}

			return results;
		}),

	myScores: protectedProcedure.query(async ({ ctx }) => {
		const playerRecord = await ensurePlayer(ctx.db, ctx.user.id);
		if (!playerRecord) {
			return [];
		}

		return ctx.db
			.select()
			.from(score)
			.where(sql`${score.playerId} = ${playerRecord.id} AND ${score.cheated} = 0`)
			.orderBy(desc(score.createdAt))
			.limit(20);
	}),

	getPublicProfile: publicProcedure
		.input(z.object({ userId: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			const userRecord = await ctx.db
				.select({
					id: user.id,
					name: user.name,
					image: user.image,
				})
				.from(user)
				.where(eq(user.id, input.userId))
				.get();

			if (!userRecord) {
				throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
			}

			const playerRecord = await ctx.db
				.select()
				.from(player)
				.where(eq(player.userId, input.userId))
				.get();

			if (!playerRecord || playerRecord.profilePublic !== 1) {
				return { isPrivate: true as const, username: userRecord.name };
			}

			const skinDef = getSkinById(playerRecord.equippedSkinId);

			const topScores = await ctx.db
				.select({
					id: score.id,
					score: score.score,
					distance: score.distance,
					obstaclesCleared: score.obstaclesCleared,
					difficulty: score.difficulty,
					createdAt: score.createdAt,
				})
				.from(score)
				.where(sql`${score.playerId} = ${playerRecord.id} AND ${score.cheated} = 0`)
				.orderBy(desc(score.score))
				.limit(10);

			const unlockedAchievements = await ctx.db
				.select({ achievementId: playerAchievement.achievementId })
				.from(playerAchievement)
				.where(eq(playerAchievement.playerId, playerRecord.id));

			const achievementIds = new Set(unlockedAchievements.map((a) => a.achievementId));
			const achievements = ACHIEVEMENTS.map((a) => ({
				id: a.id,
				name: a.name,
				icon: a.icon,
				description: a.description,
				unlocked: achievementIds.has(a.id),
			}));

			const unlockedSkins = await ctx.db
				.select({ skinId: playerSkin.skinId })
				.from(playerSkin)
				.where(eq(playerSkin.playerId, playerRecord.id));

			return {
				isPrivate: false as const,
				username: userRecord.name,
				userImage: userRecord.image,
				level: playerRecord.level,
				totalXp: playerRecord.totalXp,
				equippedSkin: skinDef
					? { id: skinDef.id, name: skinDef.name, spriteKey: skinDef.spriteKey }
					: null,
				stats: {
					totalScore: playerRecord.totalScore,
					totalDistance: playerRecord.totalDistance,
					gamesPlayed: playerRecord.gamesPlayed,
					obstaclesCleared: playerRecord.totalObstaclesCleared,
					racesPlayed: playerRecord.racesPlayed,
					racesWon: playerRecord.racesWon,
				},
				topScores,
				achievements,
				skinsUnlocked: unlockedSkins.length + 1, // +1 for default skin
			};
		}),
});
