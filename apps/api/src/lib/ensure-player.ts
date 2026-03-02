import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { player } from "../db/schema";
import type * as schema from "../db/schema";

/**
 * Gets or creates a player record for the given user.
 * Returns the player row.
 */
export async function ensurePlayer(
  db: DrizzleD1Database<typeof schema>,
  userId: string
) {
  const existing = await db
    .select()
    .from(player)
    .where(eq(player.userId, userId))
    .get();

  if (existing) return existing;

  const now = new Date();
  const id = crypto.randomUUID();

  await db.insert(player).values({
    id,
    userId,
    equippedSkinId: "gray-wolf",
    totalScore: 0,
    totalDistance: 0,
    totalObstaclesCleared: 0,
    gamesPlayed: 0,
    racesPlayed: 0,
    racesWon: 0,
    createdAt: now,
    updatedAt: now,
  });

  return db.select().from(player).where(eq(player.id, id)).get();
}
