import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc, sql, count, like } from "drizzle-orm";
import { router, devProcedure } from "../trpc";
import { user, player, score, raceHistory } from "../../db/schema";

export const adminRouter = router({
  getStats: devProcedure.query(async ({ ctx }) => {
    const [playerCount] = await ctx.db.select({ count: count() }).from(player);
    const [scoreStats] = await ctx.db
      .select({
        totalGames: count(),
        totalMeters: sql<number>`coalesce(sum(${score.distance}), 0)`,
      })
      .from(score);
    const [raceStats] = await ctx.db
      .select({
        distinctRaces: sql<number>`count(distinct ${raceHistory.raceId})`,
        totalEntries: count(),
      })
      .from(raceHistory);

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
      })
    )
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.limit;
      const searchFilter = input.search
        ? like(user.name, `%${input.search}%`)
        : undefined;

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
        total: totalResult[0].count,
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.auth.api.banUser({
        body: {
          userId: input.userId,
          banReason: input.reason,
          banExpiresIn:
            input.durationDays && input.durationDays > 0
              ? input.durationDays * 24 * 60 * 60
              : undefined,
        },
        headers: ctx.headers,
      });

      return { success: true };
    }),

  unbanUser: devProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
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
      })
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
        total: totalResult[0].count,
        page: input.page,
        limit: input.limit,
      };
    }),

  deleteScore: devProcedure
    .input(z.object({ scoreId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select()
        .from(score)
        .where(eq(score.id, input.scoreId))
        .get();

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Score not found" });
      }

      await ctx.db
        .update(player)
        .set({
          totalScore: sql`${player.totalScore} - ${existing.score}`,
          totalDistance: sql`${player.totalDistance} - ${existing.distance}`,
          totalObstaclesCleared: sql`${player.totalObstaclesCleared} - ${existing.obstaclesCleared}`,
          gamesPlayed: sql`${player.gamesPlayed} - 1`,
          updatedAt: new Date(),
        })
        .where(eq(player.id, existing.playerId));

      await ctx.db.delete(score).where(eq(score.id, input.scoreId));

      return { success: true };
    }),

  getRaces: devProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.limit;

      const [totalResult, rows] = await Promise.all([
        ctx.db.select({ count: count() }).from(raceHistory),
        ctx.db
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
          .orderBy(desc(raceHistory.createdAt))
          .limit(input.limit)
          .offset(offset),
      ]);

      return {
        items: rows,
        total: totalResult[0].count,
        page: input.page,
        limit: input.limit,
      };
    }),
});
