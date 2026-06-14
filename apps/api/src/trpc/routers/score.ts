import {
	ACHIEVEMENTS,
	DIFFICULTY_NAMES,
	MAX_DISTANCE_ABSOLUTE,
	MAX_DURATION_MS,
	MAX_OBSTACLES_ABSOLUTE,
	MAX_SCORE_ABSOLUTE,
	PERIOD_MS,
	PERIODS,
	READY_MODS_MASK,
	getLevelFromXp,
	getPeriodCutoff,
	getSkinById,
} from "@fangdash/shared";
import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { z } from "zod";
import { player, playerAchievement, playerSkin, score, user } from "../../db/schema.ts";
import { checkAllUnlocks } from "../../lib/check-all-unlocks.ts";
import { validateScoreInput } from "../../lib/validate-score.ts";
import { playerProcedure, publicProcedure, router } from "../trpc.ts";

const baseScoreSchema = z.object({
	score: z.number().int().min(0).max(MAX_SCORE_ABSOLUTE),
	distance: z.number().min(0).max(MAX_DISTANCE_ABSOLUTE),
	obstaclesCleared: z.number().int().min(0).max(MAX_OBSTACLES_ABSOLUTE),
	longestCleanRun: z.number().min(0).max(MAX_DISTANCE_ABSOLUTE).default(0),
	duration: z.number().int().min(0).max(MAX_DURATION_MS),
	seed: z.string().min(1).max(64),
	difficulty: z.enum(DIFFICULTY_NAMES).default("easy"),
	mods: z.number().int().min(0).default(0),
	cheated: z.boolean().default(false),
});

export const scoreRouter = router({
	submit: playerProcedure.input(baseScoreSchema).mutation(async ({ ctx, input }) => {
		const validation = validateScoreInput(input);
		if (!validation.valid) {
			throw new TRPCError({ code: "BAD_REQUEST", message: validation.reason });
		}

		const { playerRecord } = ctx;

		const now = new Date();
		const scoreId = crypto.randomUUID();

		const isCheated = input.cheated ? 1 : 0;

		// Atomic replay protection: the (player_id, seed) unique index backstops a
		// concurrent duplicate that a separate SELECT pre-check would race past.
		// onConflictDoNothing + empty returning ⇒ this seed was already submitted.
		const inserted = await ctx.db
			.insert(score)
			.values({
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
			})
			.onConflictDoNothing({ target: [score.playerId, score.seed] })
			.returning({ id: score.id });

		if (inserted.length === 0) {
			throw new TRPCError({
				code: "CONFLICT",
				message: "A score for this run was already submitted",
			});
		}

		// If cheated, skip all rewards and stat updates
		if (input.cheated) {
			return {
				scoreId,
				newAchievements: [],
				newSkins: [],
				unlockError: false,
				xpGained: 0,
				levelUp: false,
				newLevel: playerRecord.level,
			};
		}

		// Update player aggregate stats and XP, then derive the level from the
		// post-increment totalXp so the level is never computed from a stale read.
		// The level write itself is last-writer-wins and self-heals on the next submission.
		const previousLevel = playerRecord.level;

		const updated = await ctx.db
			.update(player)
			.set({
				totalScore: sql`${player.totalScore} + ${input.score}`,
				totalDistance: sql`${player.totalDistance} + ${input.distance}`,
				totalObstaclesCleared: sql`${player.totalObstaclesCleared} + ${input.obstaclesCleared}`,
				gamesPlayed: sql`${player.gamesPlayed} + 1`,
				totalXp: sql`${player.totalXp} + ${input.score}`,
				updatedAt: now,
			})
			.where(eq(player.id, playerRecord.id))
			.returning({ totalXp: player.totalXp });

		const newTotalXp = updated[0]?.totalXp ?? playerRecord.totalXp + input.score;
		const levelInfo = getLevelFromXp(newTotalXp);

		await ctx.db
			.update(player)
			.set({ level: levelInfo.level })
			.where(eq(player.id, playerRecord.id));

		const { newAchievements, newSkins, unlockError } = await checkAllUnlocks(
			ctx.db,
			playerRecord.id,
			"score.submit",
			scoreId,
			{
				score: input.score,
				distance: input.distance,
				obstaclesCleared: input.obstaclesCleared,
				longestCleanRun: input.longestCleanRun,
				duration: input.duration,
				mods: input.mods,
			},
		);

		return {
			scoreId,
			newAchievements,
			newSkins,
			unlockError,
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
					period: z.enum(PERIODS).default("all"),
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

			const cutoff = getPeriodCutoff(period);

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
			const outerProfileFilter = sql` AND ${player.profilePublic} = 1`;

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
					)${outerDiffFilter}${outerModsFilter}${outerCutoffFilter}${outerCheatedFilter}${outerProfileFilter}`,
				)
				.orderBy(desc(score.score))
				.limit(limit);

			return rows.map((row, index) => ({
				rank: index + 1,
				...row,
			}));
		}),

	getPlayerStats: playerProcedure.query(async ({ ctx }) => {
		return {
			gamesPlayed: ctx.playerRecord.gamesPlayed,
			totalScore: ctx.playerRecord.totalScore,
			totalDistance: ctx.playerRecord.totalDistance,
			totalObstaclesCleared: ctx.playerRecord.totalObstaclesCleared,
			totalXp: ctx.playerRecord.totalXp,
			level: ctx.playerRecord.level,
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

	batchSync: playerProcedure
		.input(
			z.object({
				scores: z
					.array(
						baseScoreSchema.extend({
							clientTimestamp: z.number().int().min(0),
						}),
					)
					.max(20),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { playerRecord } = ctx;

			const now = Date.now();
			const results: Array<{
				clientIndex: number;
				scoreId?: string;
				status: "ok" | "rejected";
				reason?: string;
			}> = [];

			// Replay protection across requests: reject seeds this player already submitted
			const candidateSeeds = [...new Set(input.scores.map((s) => s.seed))];
			const existingRows =
				candidateSeeds.length > 0
					? await ctx.db
							.select({ seed: score.seed })
							.from(score)
							.where(and(eq(score.playerId, playerRecord.id), inArray(score.seed, candidateSeeds)))
					: [];
			const existingSeeds = new Set(existingRows.map((r) => r.seed));

			const seenSeeds = new Set<string>();
			// Each insert uses onConflictDoNothing so a concurrent duplicate that slips
			// past the existingSeeds pre-check skips that single row instead of rolling
			// back the whole D1 batch. XP/stats are tallied only from rows that the
			// returning() confirms actually committed (resultRefs below).
			const insertStatements: BatchItem<"sqlite">[] = [];
			const resultRefs: Array<{
				resultIndex: number;
				batchIndex: number;
				score: (typeof input.scores)[number];
			}> = [];

			for (let i = 0; i < input.scores.length; i++) {
				const s = input.scores[i];
				if (!s) continue;

				// Reject duplicate seeds within the same batch
				if (seenSeeds.has(s.seed)) {
					results.push({ clientIndex: i, status: "rejected", reason: "Duplicate score in batch" });
					continue;
				}
				seenSeeds.add(s.seed);

				if (existingSeeds.has(s.seed)) {
					results.push({
						clientIndex: i,
						status: "rejected",
						reason: "Duplicate score (seed already submitted)",
					});
					continue;
				}

				// Reject future or expired timestamps
				if (s.clientTimestamp > now + 60_000) {
					results.push({ clientIndex: i, status: "rejected", reason: "Timestamp in the future" });
					continue;
				}
				if (now - s.clientTimestamp > PERIOD_MS.weekly) {
					results.push({ clientIndex: i, status: "rejected", reason: "Score older than 7 days" });
					continue;
				}

				// Validate mods, duration, and score bounds
				const validation = validateScoreInput(s);
				if (!validation.valid) {
					results.push({ clientIndex: i, status: "rejected", reason: validation.reason });
					continue;
				}

				const scoreId = crypto.randomUUID();
				const isCheated = s.cheated ? 1 : 0;

				const batchIndex = insertStatements.length;
				insertStatements.push(
					ctx.db
						.insert(score)
						.values({
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
							// Server-authoritative timestamp; clientTimestamp is only used for the
							// acceptance-window checks above
							createdAt: new Date(),
						})
						.onConflictDoNothing({ target: [score.playerId, score.seed] })
						.returning({ id: score.id }),
				);

				const resultIndex = results.length;
				results.push({ clientIndex: i, scoreId, status: "ok" });
				resultRefs.push({ resultIndex, batchIndex, score: s });
			}

			// Phase 1: run the inserts, then keep only the rows that actually committed
			let totalXpGained = 0;
			const acceptedNonCheated: Array<(typeof input.scores)[number]> = [];

			if (insertStatements.length > 0) {
				const insertResults = await ctx.db.batch(
					insertStatements as unknown as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]],
				);

				for (const ref of resultRefs) {
					const returned = insertResults[ref.batchIndex] as unknown as
						| Array<{ id: string }>
						| undefined;
					const committed = (returned?.length ?? 0) > 0;
					const resultEntry = results[ref.resultIndex];
					if (!committed) {
						// Lost a concurrency race against another in-flight submit of this seed.
						if (resultEntry) {
							resultEntry.status = "rejected";
							resultEntry.reason = "Duplicate score (seed already submitted)";
							delete resultEntry.scoreId;
						}
						continue;
					}
					if (!ref.score.cheated) {
						totalXpGained += ref.score.score;
						acceptedNonCheated.push(ref.score);
					}
				}
			}

			// Phase 2: single aggregate XP/stats update for committed non-cheated scores.
			// Derive the level from the post-increment totalXp so it is never computed
			// from a stale read (the level write is last-writer-wins and self-heals next sync).
			if (acceptedNonCheated.length > 0) {
				const totalDistance = acceptedNonCheated.reduce((sum, s) => sum + s.distance, 0);
				const totalObstacles = acceptedNonCheated.reduce((sum, s) => sum + s.obstaclesCleared, 0);
				const gamesCount = acceptedNonCheated.length;

				const updated = await ctx.db
					.update(player)
					.set({
						totalScore: sql`${player.totalScore} + ${totalXpGained}`,
						totalDistance: sql`${player.totalDistance} + ${totalDistance}`,
						totalObstaclesCleared: sql`${player.totalObstaclesCleared} + ${totalObstacles}`,
						gamesPlayed: sql`${player.gamesPlayed} + ${gamesCount}`,
						totalXp: sql`${player.totalXp} + ${totalXpGained}`,
						updatedAt: new Date(),
					})
					.where(eq(player.id, playerRecord.id))
					.returning({ totalXp: player.totalXp });

				const newTotalXp = updated[0]?.totalXp ?? playerRecord.totalXp + totalXpGained;
				const levelInfo = getLevelFromXp(newTotalXp);

				await ctx.db
					.update(player)
					.set({ level: levelInfo.level })
					.where(eq(player.id, playerRecord.id));
			}

			return results;
		}),

	myScores: playerProcedure.query(async ({ ctx }) => {
		return ctx.db
			.select()
			.from(score)
			.where(sql`${score.playerId} = ${ctx.playerRecord.id} AND ${score.cheated} = 0`)
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
