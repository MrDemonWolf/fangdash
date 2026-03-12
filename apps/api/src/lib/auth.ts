import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import { and, eq } from "drizzle-orm";
import * as schema from "../db/schema";

type AuthBindings = {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  TWITCH_CLIENT_ID: string;
  TWITCH_CLIENT_SECRET: string;
  ENVIRONMENT?: string;
  ADMIN_TWITCH_ID?: string;
};

const REQUIRED_AUTH_KEYS = [
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "TWITCH_CLIENT_ID",
  "TWITCH_CLIENT_SECRET",
] as const;

export function createAuth(env: AuthBindings) {
  const missing = REQUIRED_AUTH_KEYS.filter((k) => !env[k]);
  if (missing.length > 0) {
    throw new Error(`Missing required auth env vars: ${missing.join(", ")}`);
  }
  if (!env.DB) {
    throw new Error("Missing required D1 database binding: DB");
  }

  const db = drizzle(env.DB, { schema });

  const isDev = env.ENVIRONMENT !== "production";
  const trustedOrigins = isDev
    ? ["http://localhost:3000", "https://fangdash.mrdemonwolf.workers.dev"]
    : ["https://fangdash.mrdemonwolf.workers.dev"];

  const webURL = isDev
    ? "http://localhost:3000"
    : "https://fangdash.mrdemonwolf.workers.dev";

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
      user: {
        create: {
          after: async (user) => {
            if (!env.ADMIN_TWITCH_ID) return;
            const adminIds = env.ADMIN_TWITCH_ID.split(",").map((id) => id.trim());
            const acct = await db
              .select()
              .from(schema.account)
              .where(
                and(
                  eq(schema.account.userId, user.id),
                  eq(schema.account.providerId, "twitch")
                )
              )
              .get();
            if (acct && adminIds.includes(acct.accountId)) {
              await db
                .update(schema.user)
                .set({ role: "admin" })
                .where(eq(schema.user.id, user.id));
            }
          },
        },
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
