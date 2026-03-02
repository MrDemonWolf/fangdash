// Re-export only the AppRouter type for external consumers (web app).
// This file must NOT import any Cloudflare Workers types.
export type { AppRouter } from "./router";
