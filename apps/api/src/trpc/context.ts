import type { Context } from "hono";
import { createDb } from "../db/index.ts";
import { createAuth } from "../lib/auth.ts";

export async function createContext(c: Context) {
	const db = createDb(c.env.DB);
	const auth = createAuth(c.env);

	let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;
	try {
		session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});
	} catch {
		// Auth failure — continue as unauthenticated for public procedures
	}

	return {
		db,
		session: session?.session ?? null,
		user: session?.user ?? null,
	};
}

export type TRPCContext = Awaited<ReturnType<typeof createContext>>;
