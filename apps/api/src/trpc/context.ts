import type { Context } from "hono";
import { createDb } from "../db/index.ts";
import { createAuth } from "../lib/auth.ts";

export async function createContext(c: Context) {
	const db = createDb(c.env.DB);
	const auth = createAuth(c.env);

	// Better Auth's getSession return type has many optional/undefined fields.
	// We normalize them to non-undefined in the return object below.
	let sessionData: Awaited<ReturnType<NonNullable<typeof auth>["api"]["getSession"]>> | null = null;

	// Only fetch session when auth cookies are present — saves a D1 read on public requests
	const cookie = c.req.header("cookie") ?? "";
	const hasCookie = cookie
		.split(";")
		.some((part) => part.trim().startsWith("better-auth."));
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
					ipAddress: sessionData.session.ipAddress ?? null,
					userAgent: sessionData.session.userAgent ?? null,
				}
			: null,
		user: sessionData?.user
			? {
					id: sessionData.user.id,
					name: sessionData.user.name,
					email: sessionData.user.email,
					emailVerified: sessionData.user.emailVerified,
					image: sessionData.user.image ?? null,
					role: sessionData.user.role,
					banned: sessionData.user.banned ?? null,
					banReason: sessionData.user.banReason ?? null,
					banExpires: sessionData.user.banExpires ?? null,
					createdAt: sessionData.user.createdAt,
					updatedAt: sessionData.user.updatedAt,
				}
			: null,
	};
}

export type TRPCContext = Awaited<ReturnType<typeof createContext>>;
