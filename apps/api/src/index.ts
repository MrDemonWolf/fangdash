import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createAuth } from "./lib/auth.ts";
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

app.use("*", async (c, next) => {
	const isDev = c.env.ENVIRONMENT === "development";
	const origins = isDev ? ["http://localhost:3000", c.env.WEB_URL] : [c.env.WEB_URL];

	return cors({ origin: origins, credentials: true })(c, next);
});

// Better Auth handler
app.on(["POST", "GET"], "/api/auth/**", async (c) => {
	try {
		const auth = createAuth(c.env);
		if (!auth) {
			return c.json({ error: "Auth not configured" }, 503);
		}
		return await auth.handler(c.req.raw);
	} catch (err) {
		console.error("[auth] Handler error:", err);
		return c.json({ error: "Internal auth error" }, 500);
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
