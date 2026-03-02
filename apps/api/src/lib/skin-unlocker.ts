import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { player, playerSkin, playerAchievement, score } from "../db/schema";
import type * as schema from "../db/schema";
import { SKINS } from "@fangdash/shared/skins";
import type { SkinDefinition } from "@fangdash/shared/types";

/**
 * Checks all skin unlock conditions for a player and grants newly unlocked skins.
 * Called after checkAchievements to properly handle achievement-based unlocks.
 * Returns list of newly unlocked skin IDs.
 */
export async function checkSkinUnlocks(
  db: DrizzleD1Database<typeof schema>,
  playerId: string
): Promise<string[]> {
  // Get player stats
  const playerRecord = await db
    .select()
    .from(player)
    .where(eq(player.id, playerId))
    .get();

  if (!playerRecord) return [];

  // Get already owned skins
  const ownedSkins = await db
    .select({ skinId: playerSkin.skinId })
    .from(playerSkin)
    .where(eq(playerSkin.playerId, playerId));

  const ownedSkinIds = new Set(ownedSkins.map((s) => s.skinId));

  // Get player's unlocked achievements
  const unlockedAchievements = await db
    .select({ achievementId: playerAchievement.achievementId })
    .from(playerAchievement)
    .where(eq(playerAchievement.playerId, playerId));

  const achievementIds = new Set(
    unlockedAchievements.map((a) => a.achievementId)
  );

  const newSkins: string[] = [];
  const now = new Date();

  const highestScoreRow = await db
    .select({ value: score.score })
    .from(score)
    .where(eq(score.playerId, playerId))
    .orderBy(score.score)
    .limit(1)
    .get();

  const highestDistanceRow = await db
    .select({ value: score.distance })
    .from(score)
    .where(eq(score.playerId, playerId))
    .orderBy(score.distance)
    .limit(1)
    .get();

  const highestScore = highestScoreRow?.value ?? 0;
  const highestDistance = highestDistanceRow?.value ?? 0;

  for (const skin of SKINS) {
    if (ownedSkinIds.has(skin.id)) continue;

    if (
      isSkinUnlocked(skin, {
        highestScore,
        highestDistance,
        gamesPlayed: playerRecord.gamesPlayed,
        achievementIds,
      })
    ) {
      try {
        await db.insert(playerSkin).values({
          id: crypto.randomUUID(),
          playerId,
          skinId: skin.id,
          unlockedAt: now,
        });
        newSkins.push(skin.id);
      } catch {
        // Unique constraint — already owns this skin
      }
    }
  }

  return newSkins;
}

export function isSkinUnlocked(
  skin: SkinDefinition,
  stats: {
    highestScore: number;
    highestDistance: number;
    gamesPlayed: number;
    achievementIds: Set<string>;
  }
): boolean {
  const { unlockCondition } = skin;

  switch (unlockCondition.type) {
    case "default":
      return true;
    case "score":
      return stats.highestScore >= unlockCondition.threshold;
    case "distance":
      return stats.highestDistance >= unlockCondition.threshold;
    case "games_played":
      return stats.gamesPlayed >= unlockCondition.count;
    case "achievement":
      return stats.achievementIds.has(unlockCondition.achievementId);
    default:
      return false;
  }
}
