import type { Context, Next } from "hono";

interface RateLimitEntry {
	count: number;
	resetAt: number;
}

const mutationBuckets = new Map<string, RateLimitEntry>();
const queryBuckets = new Map<string, RateLimitEntry>();

const MUTATION_LIMIT = 10;
const QUERY_LIMIT = 60;
const WINDOW_MS = 60_000; // 1 minute

let lastCleanup = Date.now();

function getClientIp(c: Context): string {
	return (
		c.req.header("cf-connecting-ip") ??
		c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
		"unknown"
	);
}

function checkLimit(buckets: Map<string, RateLimitEntry>, key: string): RateLimitEntry {
	const now = Date.now();
	let entry = buckets.get(key);

	if (!entry || now >= entry.resetAt) {
		entry = { count: 0, resetAt: now + WINDOW_MS };
		buckets.set(key, entry);
	}

	entry.count++;
	return entry;
}

function lazyCleanup() {
	const now = Date.now();
	if (now - lastCleanup < WINDOW_MS) return;
	lastCleanup = now;

	for (const [key, entry] of mutationBuckets) {
		if (now >= entry.resetAt) mutationBuckets.delete(key);
	}
	for (const [key, entry] of queryBuckets) {
		if (now >= entry.resetAt) queryBuckets.delete(key);
	}
}

export async function rateLimitMiddleware(c: Context, next: Next) {
	// Only rate-limit tRPC routes
	if (!c.req.path.startsWith("/trpc/")) {
		return next();
	}

	lazyCleanup();

	const ip = getClientIp(c);
	const isMutation = c.req.method === "POST";
	const buckets = isMutation ? mutationBuckets : queryBuckets;
	const limit = isMutation ? MUTATION_LIMIT : QUERY_LIMIT;

	const entry = checkLimit(buckets, ip);

	if (entry.count > limit) {
		const retryAfter = Math.ceil((entry.resetAt - Date.now()) / 1000);
		return c.json(
			{ error: "Too many requests" },
			{ status: 429, headers: { "Retry-After": String(Math.max(1, retryAfter)) } },
		);
	}

	return next();
}
