import { drizzle } from "drizzle-orm/d1";
// biome-ignore lint/performance/noNamespaceImport: drizzle requires namespace import for schema
import * as schema from "./schema.ts";

export function createDb(d1: D1Database) {
	return drizzle(d1, { schema });
}

export type Database = ReturnType<typeof createDb>;
export { schema };
