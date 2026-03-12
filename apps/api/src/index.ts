import { Hono } from "hono";
import { cors } from "hono/cors";
import { trpcServer } from "@hono/trpc-server";
import { createAuth } from "./lib/auth";
import { appRouter } from "./trpc/router";
import { createContext } from "./trpc/context";

type Bindings = {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  TWITCH_CLIENT_ID: string;
  TWITCH_CLIENT_SECRET: string;
  ENVIRONMENT: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", async (c, next) => {
  const isDev = c.env.ENVIRONMENT !== "production";
  const origins = isDev
    ? ["http://localhost:3000", "https://fangdash.pages.dev"]
    : ["https://fangdash.pages.dev"];

  return cors({ origin: origins, credentials: true })(c, next);
});

// Better Auth handler
app.on(["POST", "GET"], "/api/auth/**", (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

// tRPC handler
app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, c) => createContext(c),
  })
);

app.get("/", (c) => {
  return c.json({ name: "FangDash API", status: "ok" });
});

app.get("/health", (c) => {
  return c.json({ status: "healthy" });
});

export default app;
