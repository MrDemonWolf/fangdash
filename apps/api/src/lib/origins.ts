import type { Bindings } from "../types.ts";

export function getTrustedOrigins(env: Pick<Bindings, "ENVIRONMENT" | "WEB_URL">): string[] {
	const isDev = env.ENVIRONMENT === "development";
	const webURL = env.WEB_URL ?? "";
	return isDev ? ["http://localhost:3000", webURL] : [webURL];
}
