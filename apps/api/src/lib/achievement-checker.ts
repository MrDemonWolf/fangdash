import { eq, desc } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { player, playerAchievement, playerSkin, score } from "../db/schema";
import type * as schema from "../db/schema";
import { ACHIEVEMENTS } from "@fangdash/shared/achievements";
import type { AchievementDefinition } from "@fangdash/shared/types";

export interface PlayerStats {
  highestScore: number;
  highestDistance: number;
  totalScore: number;
  totalDistance: number;
  totalObstaclesCleared: number;
  gamesPlayed: number;
  racesPlayed: number;
  racesWon: number;
}

interface CheckResult {
  newAchievements: string[];
  newSkins: string[];
}

/**
 * Checks all achievements for a player and grants newly earned ones.
 * Also grants reward skins from newly unlocked achievements.
 */
export async function checkAchievements(
  db: DrizzleD1Database<typeof schema>,
  playerId: string,
  latestScore?: { score: number; distance: number; obstaclesCleared: number }
): Promise<CheckResult> {
  // Get player stats
  const playerRecord = await db
    .select()
    .from(player)
    .where(eq(player.id, playerId))
    .get();

  if (!playerRecord) return { newAchievements: [], newSkins: [] };

  // Get already unlocked achievements
  const existing = await db
    .select({ achievementId: playerAchievement.achievementId })
    .from(playerAchievement)
    .where(eq(playerAchievement.playerId, playerId));

  const unlockedIds = new Set(existing.map((e) => e.achievementId));

  // Get highest single-run score and distance from score history
  const highestScoreRow = await db
    .select({ value: score.score })
    .from(score)
    .where(eq(score.playerId, playerId))
    .orderBy(desc(score.score))
    .limit(1)
    .get();

  const highestDistanceRow = await db
    .select({ value: score.distance })
    .from(score)
    .where(eq(score.playerId, playerId))
    .orderBy(desc(score.distance))
    .limit(1)
    .get();

  const stats: PlayerStats = {
    highestScore: Math.max(
      highestScoreRow?.value ?? 0,
      latestScore?.score ?? 0
    ),
    highestDistance: Math.max(
      highestDistanceRow?.value ?? 0,
      latestScore?.distance ?? 0
    ),
    totalScore: playerRecord.totalScore,
    totalDistance: playerRecord.totalDistance,
    totalObstaclesCleared: playerRecord.totalObstaclesCleared,
    gamesPlayed: playerRecord.gamesPlayed,
    racesPlayed: playerRecord.racesPlayed,
    racesWon: playerRecord.racesWon,
  };

  const newAchievements: string[] = [];
  const newSkins: string[] = [];
  const now = new Date();

  for (const achievement of ACHIEVEMENTS) {
    if (unlockedIds.has(achievement.id)) continue;

    if (isAchievementEarned(achievement, stats)) {
      await db.insert(playerAchievement).values({
        id: crypto.randomUUID(),
        playerId,
        achievementId: achievement.id,
        unlockedAt: now,
      });
      newAchievements.push(achievement.id);

      // Grant reward skin if applicable
      if (achievement.rewardSkinId) {
        const skinGranted = await grantSkin(
          db,
          playerId,
          achievement.rewardSkinId
        );
        if (skinGranted) {
          newSkins.push(achievement.rewardSkinId);
        }
      }
    }
  }

  return { newAchievements, newSkins };
}

export function isAchievementEarned(
  achievement: AchievementDefinition,
  stats: PlayerStats
): boolean {
  const { condition } = achievement;

  switch (condition.type) {
    case "score_single":
      return stats.highestScore >= condition.threshold;
    case "score_total":
      return stats.totalScore >= condition.threshold;
    case "distance_single":
      return stats.highestDistance >= condition.threshold;
    case "distance_total":
      return stats.totalDistance >= condition.threshold;
    case "games_played":
      return stats.gamesPlayed >= condition.count;
    case "obstacles_cleared":
      return stats.totalObstaclesCleared >= condition.count;
    case "races_won":
      return stats.racesWon >= condition.count;
    case "races_played":
      return stats.racesPlayed >= condition.count;
    case "perfect_run":
      // This requires special tracking from the game client.
      // For now, we can't check this server-side without additional data.
      return false;
    default:
      return false;
  }
}

/**
 * Grants a skin to a player if they don't already have it.
 * Returns true if the skin was newly granted.
 */
async function grantSkin(
  db: DrizzleD1Database<typeof schema>,
  playerId: string,
  skinId: string
): Promise<boolean> {
  try {
    await db.insert(playerSkin).values({
      id: crypto.randomUUID(),
      playerId,
      skinId,
      unlockedAt: new Date(),
    });
    return true;
  } catch {
    // Unique constraint violation — already has this skin
    return false;
  }
}
