import type { MiddlewareHandler } from "hono";

/**
 * Adds security headers to every response.
 */
export const securityHeaders: MiddlewareHandler = async (c, next) => {
	await next();

	c.res.headers.set("X-Content-Type-Options", "nosniff");
	c.res.headers.set("X-Frame-Options", "DENY");
	c.res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
	c.res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
};
