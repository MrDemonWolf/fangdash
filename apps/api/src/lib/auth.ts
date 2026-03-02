import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";

type AuthBindings = {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  TWITCH_CLIENT_ID: string;
  TWITCH_CLIENT_SECRET: string;
};

export function createAuth(env: AuthBindings) {
  const db = drizzle(env.DB, { schema });

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
        maxAge: 5 * 60,
      },
    },
    trustedOrigins: ["http://localhost:3000", "https://fangdash.mrdemonwolf.workers.dev"],
  });
}

export type Auth = ReturnType<typeof createAuth>;
