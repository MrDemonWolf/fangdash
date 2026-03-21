import type { Context } from "hono";
import { createDb } from "../db/index.ts";
import { createAuth } from "../lib/auth.ts";

export async function createContext(c: Context) {
	const db = createDb(c.env.DB);
	const auth = createAuth(c.env);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let sessionData: { session: any; user: any } | null = null;

	// Only fetch session when auth cookies are present — saves a D1 read on public requests
	const hasCookie = c.req.header("cookie")?.includes("better-auth");
	if (auth && hasCookie) {
		try {
			sessionData = await auth.api.getSession({
				headers: c.req.raw.headers,
			});
		} catch {
			// Auth failure — continue as unauthenticated for public procedures
		}
	}

	return {
		db,
		auth: auth as unknown as {
			api: {
				banUser(opts: {
					body: { userId: string; banReason?: string; banExpiresIn?: number };
					headers: Headers;
				}): Promise<unknown>;
				unbanUser(opts: { body: { userId: string }; headers: Headers }): Promise<unknown>;
			};
		} | null,
		headers: c.req.raw.headers,
		session: sessionData?.session
			? {
					id: sessionData.session.id,
					userId: sessionData.session.userId,
					token: sessionData.session.token,
					expiresAt: sessionData.session.expiresAt,
					ipAddress: sessionData.session.ipAddress,
					userAgent: sessionData.session.userAgent,
				}
			: null,
		user: sessionData?.user
			? {
					id: sessionData.user.id,
					name: sessionData.user.name,
					email: sessionData.user.email,
					emailVerified: sessionData.user.emailVerified,
					image: sessionData.user.image,
					role: sessionData.user.role,
					banned: sessionData.user.banned,
					banReason: sessionData.user.banReason,
					banExpires: sessionData.user.banExpires,
					createdAt: sessionData.user.createdAt,
					updatedAt: sessionData.user.updatedAt,
				}
			: null,
	};
}

export type TRPCContext = Awaited<ReturnType<typeof createContext>>;
