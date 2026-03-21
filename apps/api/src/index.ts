import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createAuth } from "./lib/auth.ts";
import { rateLimitMiddleware } from "./middleware/rate-limit.ts";
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
		console.error("[auth] Handler error:", err);
		return c.json({ error: "Internal auth error" }, 500);
	}
});

// Cache-Control for public read-heavy tRPC queries (reduces CF Worker invocations)
const PUBLIC_CACHE_ROUTES: Record<string, number> = {
	"score.leaderboard": 30, // 30s
	"score.getGlobalStats": 300, // 5 min
	"achievement.list": 3600, // 1 hour (static definitions)
};

app.use("/trpc/*", async (c, next) => {
	await next();
	if (c.req.method === "GET") {
		// Extract procedure name from batch URL (e.g., /trpc/score.leaderboard)
		const path = c.req.path.replace("/trpc/", "");
		const maxAge = PUBLIC_CACHE_ROUTES[path];
		if (maxAge && c.res.status === 200) {
			c.res.headers.set("Cache-Control", `public, max-age=${maxAge}, s-maxage=${maxAge}`);
		}
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

app.get("/health", (c) => {
	return c.json({ status: "healthy" });
});

export default app;
