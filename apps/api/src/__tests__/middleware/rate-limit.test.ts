import { describe, expect, it, beforeEach } from "vitest";
import { Hono } from "hono";
import { rateLimitMiddleware } from "../../middleware/rate-limit.ts";

function createApp() {
	const app = new Hono();
	app.use("*", rateLimitMiddleware);
	app.get("/health", (c) => c.json({ ok: true }));
	app.get("/trpc/score.leaderboard", (c) => c.json({ result: [] }));
	app.post("/trpc/score.submit", (c) => c.json({ result: "ok" }));
	return app;
}

describe("rate-limit middleware", () => {
	let app: ReturnType<typeof createApp>;

	beforeEach(() => {
		// Create a fresh app for each test to reset rate limit buckets
		// The module-level Maps persist across tests, so we import fresh
		app = createApp();
	});

	it("should skip rate limiting for non-tRPC paths", async () => {
		const responses = [];
		for (let i = 0; i < 100; i++) {
			const res = await app.request("/health");
			responses.push(res.status);
		}

		expect(responses.every((s) => s === 200)).toBe(true);
	});

	it("should enforce mutation limit on POST requests", async () => {
		const statuses = [];
		// MUTATION_LIMIT is 10, so 11th request should be 429
		for (let i = 0; i < 12; i++) {
			const res = await app.request("/trpc/score.submit", { method: "POST" });
			statuses.push(res.status);
		}

		// First 10 should pass
		expect(statuses.slice(0, 10).every((s) => s === 200)).toBe(true);
		// 11th and 12th should be rate limited
		expect(statuses[10]).toBe(429);
		expect(statuses[11]).toBe(429);
	});

	it("should enforce query limit on GET requests", async () => {
		const statuses = [];
		// QUERY_LIMIT is 60, so 61st request should be 429
		for (let i = 0; i < 62; i++) {
			const res = await app.request("/trpc/score.leaderboard");
			statuses.push(res.status);
		}

		expect(statuses.slice(0, 60).every((s) => s === 200)).toBe(true);
		expect(statuses[60]).toBe(429);
	});

	it("should return Retry-After header on 429", async () => {
		// Exhaust mutation limit
		for (let i = 0; i < 11; i++) {
			await app.request("/trpc/score.submit", { method: "POST" });
		}

		const res = await app.request("/trpc/score.submit", { method: "POST" });
		expect(res.status).toBe(429);

		const retryAfter = res.headers.get("Retry-After");
		expect(retryAfter).toBeTruthy();
		expect(Number(retryAfter)).toBeGreaterThanOrEqual(1);
	});
});
