import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema.ts";

type AuthBindings = {
	DB: D1Database;
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_URL: string;
	TWITCH_CLIENT_ID: string;
	TWITCH_CLIENT_SECRET: string;
	WEB_URL: string;
	ENVIRONMENT?: string;
};

const REQUIRED_AUTH_KEYS = [
	"BETTER_AUTH_SECRET",
	"BETTER_AUTH_URL",
	"TWITCH_CLIENT_ID",
	"TWITCH_CLIENT_SECRET",
	"WEB_URL",
] as const;

let didWarnMissingAuth = false;

export function createAuth(env: AuthBindings) {
	const missing = REQUIRED_AUTH_KEYS.filter((k) => !env[k]);
	if (missing.length > 0) {
		if (!didWarnMissingAuth) {
			console.warn(`[auth] Auth disabled — missing env vars: ${missing.join(", ")}`);
			didWarnMissingAuth = true;
		}
		return null;
	}
	if (!env.DB) {
		throw new Error("Missing required D1 database binding: DB");
	}

	const db = drizzle(env.DB, { schema });

	const isDev = env.ENVIRONMENT === "development";
	const webURL = env.WEB_URL;
	const trustedOrigins = isDev ? ["http://localhost:3000", webURL] : [webURL];

	return betterAuth({
		database: drizzleAdapter(db, {
			provider: "sqlite",
			schema: {
				user: schema.user,
				session: schema.session,
				account: schema.account,
				verification: schema.verification,
			},
		}),
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		socialProviders: {
			twitch: {
				clientId: env.TWITCH_CLIENT_ID,
				clientSecret: env.TWITCH_CLIENT_SECRET,
			},
		},
		user: {
			additionalFields: {
				twitchId: {
					type: "string",
					required: false,
				},
				twitchAvatar: {
					type: "string",
					required: false,
				},
			},
		},
		session: {
			cookieCache: {
				enabled: true,
				maxAge: 30 * 60,
			},
		},
		trustedOrigins,
		onAPIError: {
			errorURL: `${webURL}/auth/error`,
		},
		plugins: [
			admin({
				defaultRole: "user",
			}),
		],
		databaseHooks: {
			session: {
				create: {
					after: async (session) => {
						// Look up the user's Twitch account
						const accounts = await db
							.select({
								accountId: schema.account.accountId,
								providerId: schema.account.providerId,
							})
							.from(schema.account)
							.where(eq(schema.account.userId, session.userId));

						const twitchAccount = accounts.find((a) => a.providerId === "twitch");
						if (!twitchAccount) return;

						// Backfill twitchId and twitchAvatar if missing
						const userRecord = await db
							.select({
								twitchId: schema.user.twitchId,
								twitchAvatar: schema.user.twitchAvatar,
								image: schema.user.image,
							})
							.from(schema.user)
							.where(eq(schema.user.id, session.userId))
							.get();

						if (userRecord && (!userRecord["twitchId"] || !userRecord["twitchAvatar"])) {
							const updates: Record<string, unknown> = {};
							if (!userRecord["twitchId"]) {
								updates["twitchId"] = twitchAccount.accountId;
							}
							if (!userRecord["twitchAvatar"] && userRecord.image) {
								updates["twitchAvatar"] = userRecord.image;
							}
							if (Object.keys(updates).length > 0) {
								await db
									.update(schema.user)
									.set(updates)
									.where(eq(schema.user.id, session.userId));
							}
						}

					},
				},
			},
		},
	});
}

export type Auth = NonNullable<ReturnType<typeof createAuth>>;
