import { trpcServer } from "@hono/trpc-server";
import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createDb } from "./db/index.ts";
import { user } from "./db/schema.ts";
import { createAuth } from "./lib/auth.ts";
import { rateLimitMiddleware } from "./middleware/rate-limit.ts";
import { securityHeaders } from "./middleware/security-headers.ts";
import { createContext } from "./trpc/context.ts";
import { appRouter } from "./trpc/router.ts";

type Bindings = {
	DB: D1Database;
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_URL: string;
	TWITCH_CLIENT_ID: string;
	TWITCH_CLIENT_SECRET: string;
	ENVIRONMENT: string;
	WEB_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(
	"*",
	cors({
		origin: (origin, c) => {
			const isDev = c.env.ENVIRONMENT === "development";
			const webURL = c.env.WEB_URL ?? "";
			const allowed = isDev ? ["http://localhost:3000", webURL] : [webURL];
			return allowed.includes(origin) ? origin : null;
		},
		credentials: true,
	}),
);

// Security headers
app.use("*", securityHeaders);

// Rate limiting
app.use("*", rateLimitMiddleware);

// Better Auth handler
app.on(["POST", "GET"], "/api/auth/**", async (c) => {
	try {
		const auth = createAuth(c.env);
		if (!auth) {
			return c.json({ error: "Auth not configured" }, 503);
		}
		const response = await auth.handler(c.req.raw);
		// Re-wrap with fresh mutable headers so Hono's CORS middleware can
		// apply Access-Control-Allow-Origin to Better Auth's raw Response.
		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: new Headers(response.headers),
		});
	} catch (err) {
		const name = err instanceof Error ? err.name : typeof err;
		const message = err instanceof Error ? err.message : "Unknown error";
		console.error("[auth] Handler error:", name, message);
		return c.json({ error: "Internal auth error" }, 500);
	}
});

// Cache-Control for public read-heavy tRPC queries (reduces CF Worker invocations)
const PUBLIC_CACHE_ROUTES: Record<string, number> = {
	"score.leaderboard": 30, // 30s
	"score.getGlobalStats": 300, // 5 min
	"achievement.list": 3600, // 1 hour (static definitions)
};

// Cache-Control middleware for public tRPC queries (runs before handler, applies after)
app.use("/trpc/*", async (c, next) => {
	await next();

	// After tRPC responds, apply cache headers for public GET endpoints
	try {
		if (c.req.method === "GET" && c.res.status === 200) {
			const path = c.req.path.replace("/trpc/", "");
			const maxAge = PUBLIC_CACHE_ROUTES[path];
			if (maxAge) {
				c.res.headers.set("Cache-Control", `public, max-age=${maxAge}, s-maxage=${maxAge}`);
			}
		}
	} catch {
		// Cache header failure should never break the response
	}
});

// tRPC handler
app.use(
	"/trpc/*",
	trpcServer({
		router: appRouter,
		createContext: (_opts, c) => createContext(c),
	}),
);

app.get("/", (c) => {
	return c.json({ name: "FangDash API", status: "ok" });
});

app.get("/health", async (c) => {
	try {
		const db = createDb(c.env.DB);
		const result = await db
			.select({ cnt: sql<number>`count(*)` })
			.from(user)
			.get();
		const auth = createAuth(c.env);

		return c.json({
			status: "healthy",
			db: result ? "connected" : "error",
			auth: auth ? "configured" : "not_configured",
			timestamp: new Date().toISOString(),
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : "Unknown";
		console.error("[health] DB check failed:", message);
		return c.json({ status: "unhealthy", error: message }, 503);
	}
});

export default app;
