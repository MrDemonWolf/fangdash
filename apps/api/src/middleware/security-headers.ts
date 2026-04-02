import type { MiddlewareHandler } from "hono";

const CSP = [
	"default-src 'self'",
	"script-src 'self' 'unsafe-inline'",
	"style-src 'self' 'unsafe-inline'",
	"img-src 'self' data: https:",
	"connect-src 'self' wss: https:",
	"font-src 'self'",
	"frame-ancestors 'none'",
].join("; ");

/**
 * Adds security headers to every response.
 */
export const securityHeaders: MiddlewareHandler = async (c, next) => {
	await next();

	c.res.headers.set("Content-Security-Policy", CSP);
	c.res.headers.set("X-Content-Type-Options", "nosniff");
	c.res.headers.set("X-Frame-Options", "DENY");
	c.res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
	c.res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
};
