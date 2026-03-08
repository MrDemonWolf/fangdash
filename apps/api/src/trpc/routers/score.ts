import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc, sql, gte } from "drizzle-orm";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import { score, player, user } from "../../db/schema";
import { ensurePlayer } from "../../lib/ensure-player";
import { checkAchievements } from "../../lib/achievement-checker";
import { checkSkinUnlocks } from "../../lib/skin-unlocker";

const MAX_SCORE_PER_SECOND = 15;

export const scoreRouter = router({
  submit: protectedProcedure
    .input(
      z.object({
        score: z.number().int().min(0),
        distance: z.number().min(0),
        obstaclesCleared: z.number().int().min(0),
        duration: z.number().int().min(0),
        seed: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Anti-cheat: reject impossible scores
      const maxAllowedScore = (input.duration / 1000) * MAX_SCORE_PER_SECOND;
      if (input.score > maxAllowedScore) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Score exceeds maximum allowed rate" });
      }

      const playerRecord = await ensurePlayer(ctx.db, ctx.user.id);
      if (!playerRecord) throw new Error("Failed to create player");

      const now = new Date();
      const scoreId = crypto.randomUUID();

      await ctx.db.insert(score).values({
        id: scoreId,
        playerId: playerRecord.id,
        score: input.score,
        distance: input.distance,
        obstaclesCleared: input.obstaclesCleared,
        duration: input.duration,
        seed: input.seed,
        createdAt: now,
      });

      // Update player aggregate stats
      await ctx.db
        .update(player)
        .set({
          totalScore: sql`${player.totalScore} + ${input.score}`,
          totalDistance: sql`${player.totalDistance} + ${input.distance}`,
          totalObstaclesCleared: sql`${player.totalObstaclesCleared} + ${input.obstaclesCleared}`,
          gamesPlayed: sql`${player.gamesPlayed} + 1`,
          updatedAt: now,
        })
        .where(eq(player.id, playerRecord.id));

      // Check achievements and skin unlocks after score submission
      const achievementResult = await checkAchievements(
        ctx.db,
        playerRecord.id,
        {
          score: input.score,
          distance: input.distance,
          obstaclesCleared: input.obstaclesCleared,
        }
      );
      const newSkinUnlocks = await checkSkinUnlocks(
        ctx.db,
        playerRecord.id
      );

      return {
        scoreId,
        newAchievements: achievementResult.newAchievements,
        newSkins: [
          ...achievementResult.newSkins,
          ...newSkinUnlocks,
        ],
      };
    }),

  leaderboard: publicProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(100).default(50),
          period: z.enum(["daily", "weekly", "all"]).default("all"),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;
      const period = input?.period ?? "all";

      const cutoff =
        period === "daily"  ? new Date(Date.now() - 24 * 60 * 60 * 1000) :
        period === "weekly" ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) :
        null;

      const rows = await ctx.db
        .select({
          scoreId: score.id,
          score: score.score,
          distance: score.distance,
          playerId: player.id,
          username: user.name,
          skinId: player.equippedSkinId,
          createdAt: score.createdAt,
        })
        .from(score)
        .innerJoin(player, eq(score.playerId, player.id))
        .innerJoin(user, eq(player.userId, user.id))
        .where(
          cutoff
            ? sql`${score.createdAt} >= ${cutoff} AND ${score.score} = (
                SELECT MAX(s2.score) FROM score s2
                WHERE s2.player_id = ${score.playerId}
                AND s2.created_at >= ${cutoff}
              )`
            : sql`${score.score} = (
                SELECT MAX(s2.score) FROM score s2
                WHERE s2.player_id = ${score.playerId}
              )`
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
    if (!playerRecord) return null;

    return {
      gamesPlayed: playerRecord.gamesPlayed,
      totalScore: playerRecord.totalScore,
      totalDistance: playerRecord.totalDistance,
      totalObstaclesCleared: playerRecord.totalObstaclesCleared,
    };
  }),

  myScores: protectedProcedure.query(async ({ ctx }) => {
    const playerRecord = await ensurePlayer(ctx.db, ctx.user.id);
    if (!playerRecord) return [];

    return ctx.db
      .select()
      .from(score)
      .where(eq(score.playerId, playerRecord.id))
      .orderBy(desc(score.createdAt))
      .limit(20);
  }),
});
