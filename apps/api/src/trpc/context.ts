import type { Context } from "hono";
import { createAuth } from "../lib/auth";
import { createDb } from "../db";

export async function createContext(c: Context) {
  const db = createDb(c.env.DB);
  const auth = createAuth(c.env);

  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  return {
    db,
    session: session?.session ?? null,
    user: session?.user ?? null,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createContext>>;
