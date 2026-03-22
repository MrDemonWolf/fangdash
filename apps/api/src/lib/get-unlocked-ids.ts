import { DEFAULT_SKIN_ID } from "@fangdash/shared";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type * as schema from "../db/schema.ts";
import { playerSkin } from "../db/schema.ts";

/**
 * Returns a Set of skin IDs unlocked by a player (always includes the default skin).
 */
export async function getUnlockedSkinIds(
	db: DrizzleD1Database<typeof schema>,
	playerId: string,
): Promise<Set<string>> {
	const unlocked = await db
		.select({ skinId: playerSkin.skinId })
		.from(playerSkin)
		.where(eq(playerSkin.playerId, playerId));

	const skinIds = new Set(unlocked.map((r) => r.skinId));
	skinIds.add(DEFAULT_SKIN_ID);
	return skinIds;
}
