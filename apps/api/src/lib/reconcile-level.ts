import { getLevelFromXp } from "@fangdash/shared";
import { eq } from "drizzle-orm";
import type { Database } from "../db/index.ts";
import { player } from "../db/schema.ts";

/**
 * Derive a player's level from their post-increment totalXp and persist it.
 *
 * The level write is last-writer-wins and self-heals on the next run, so this
 * is intentionally a plain update rather than a transaction. Shared by
 * score.submit, score.batchSync, and race.submitResult so the reconciliation
 * lives in exactly one place.
 */
export async function reconcileLevel(
	db: Database,
	playerId: string,
	newTotalXp: number,
): Promise<{ level: number }> {
	const { level } = getLevelFromXp(newTotalXp);
	await db.update(player).set({ level }).where(eq(player.id, playerId));
	return { level };
}
