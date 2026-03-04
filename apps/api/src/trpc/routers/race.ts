import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc";
import { raceHistory, player } from "../../db/schema";
import { ensurePlayer } from "../../lib/ensure-player";
import { checkAchievements } from "../../lib/achievement-checker";
import { checkSkinUnlocks } from "../../lib/skin-unlocker";

export const raceRouter = router({
  submitResult: protectedProcedure
    .input(
      z.object({
        raceId: z.string().min(1),
        score: z.number().int().min(0),
        distance: z.number().min(0),
        seed: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const playerRecord = await ensurePlayer(ctx.db, ctx.user.id);
      if (!playerRecord) throw new Error("Failed to create player");

      // Compute placement server-side
      const existingResults = await ctx.db
        .select({ id: raceHistory.id })
        .from(raceHistory)
        .where(eq(raceHistory.raceId, input.raceId));
      const placement = existingResults.length + 1;

      const now = new Date();
      const raceHistoryId = crypto.randomUUID();

      await ctx.db.insert(raceHistory).values({
        id: raceHistoryId,
        raceId: input.raceId,
        playerId: playerRecord.id,
        placement,
        score: input.score,
        distance: input.distance,
        seed: input.seed,
        createdAt: now,
      });

      // Update player race stats
      const updateSet: Record<string, unknown> = {
        racesPlayed: sql`${player.racesPlayed} + 1`,
        updatedAt: now,
      };

      if (placement === 1) {
        updateSet.racesWon = sql`${player.racesWon} + 1`;
      }

      await ctx.db
        .update(player)
        .set(updateSet)
        .where(eq(player.id, playerRecord.id));

      // Check achievements and skin unlocks after race submission
      const achievementResult = await checkAchievements(
        ctx.db,
        playerRecord.id
      );
      const newSkinUnlocks = await checkSkinUnlocks(
        ctx.db,
        playerRecord.id
      );

      return {
        raceHistoryId,
        newAchievements: achievementResult.newAchievements,
        newSkins: [
          ...achievementResult.newSkins,
          ...newSkinUnlocks,
        ],
      };
    }),

  getHistory: protectedProcedure.query(async ({ ctx }) => {
    const playerRecord = await ensurePlayer(ctx.db, ctx.user.id);
    if (!playerRecord) return [];

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
      .where(eq(raceHistory.playerId, playerRecord.id))
      .orderBy(desc(raceHistory.createdAt))
      .limit(20);
  }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const playerRecord = await ensurePlayer(ctx.db, ctx.user.id);
    if (!playerRecord) return { racesPlayed: 0, racesWon: 0 };

    return {
      racesPlayed: playerRecord.racesPlayed,
      racesWon: playerRecord.racesWon,
    };
  }),
});
