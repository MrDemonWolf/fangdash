import { count, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { SQLiteColumn, SQLiteTable } from "drizzle-orm/sqlite-core";
import type * as schema from "../db/schema.ts";
import { player } from "../db/schema.ts";

/**
 * Returns total player count and per-ID unlock counts for any unlock table.
 * Shared between skin and achievement stats endpoints.
 */
export async function getUnlockStats(
	db: DrizzleD1Database<typeof schema>,
	unlockTable: SQLiteTable,
	idColumn: SQLiteColumn,
): Promise<Record<string, { unlockCount: number; totalPlayers: number }>> {
	const [totalPlayersResult, unlockCounts] = await Promise.all([
		db.select({ total: count() }).from(player),
		db
			.select({
				itemId: idColumn,
				unlockCount: sql<number>`count(*)`,
			})
			.from(unlockTable)
			.groupBy(idColumn),
	]);

	const totalPlayers = totalPlayersResult[0]?.total ?? 0;
	const result: Record<string, { unlockCount: number; totalPlayers: number }> = {};

	for (const row of unlockCounts) {
		result[row.itemId as string] = {
			unlockCount: row.unlockCount,
			totalPlayers,
		};
	}

	return result;
}
