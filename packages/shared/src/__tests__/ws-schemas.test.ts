import { describe, expect, it } from "vitest";
import { clientMessageSchema } from "../ws-schemas.ts";

describe("clientMessageSchema", () => {
	describe("join", () => {
		it("should accept valid join message", () => {
			const result = clientMessageSchema.safeParse({
				type: "join",
				payload: { username: "player1", skinId: "gray-wolf" },
			});
			expect(result.success).toBe(true);
		});

		it("should reject username exceeding 50 chars", () => {
			const result = clientMessageSchema.safeParse({
				type: "join",
				payload: { username: "a".repeat(51), skinId: "gray-wolf" },
			});
			expect(result.success).toBe(false);
		});

		it("should reject empty username", () => {
			const result = clientMessageSchema.safeParse({
				type: "join",
				payload: { username: "", skinId: "gray-wolf" },
			});
			expect(result.success).toBe(false);
		});
	});

	describe("update", () => {
		it("should accept valid update message", () => {
			const result = clientMessageSchema.safeParse({
				type: "update",
				payload: { distance: 500, score: 1000 },
			});
			expect(result.success).toBe(true);
		});

		it("should reject distance exceeding 1M", () => {
			const result = clientMessageSchema.safeParse({
				type: "update",
				payload: { distance: 1_000_001, score: 1000 },
			});
			expect(result.success).toBe(false);
		});

		it("should reject score exceeding 10M", () => {
			const result = clientMessageSchema.safeParse({
				type: "update",
				payload: { distance: 500, score: 10_000_001 },
			});
			expect(result.success).toBe(false);
		});

		it("should reject negative distance", () => {
			const result = clientMessageSchema.safeParse({
				type: "update",
				payload: { distance: -1, score: 100 },
			});
			expect(result.success).toBe(false);
		});

		it("should reject negative score", () => {
			const result = clientMessageSchema.safeParse({
				type: "update",
				payload: { distance: 100, score: -1 },
			});
			expect(result.success).toBe(false);
		});
	});

	describe("died", () => {
		it("should accept valid died message", () => {
			const result = clientMessageSchema.safeParse({ type: "died" });
			expect(result.success).toBe(true);
		});
	});

	describe("ready", () => {
		it("should accept valid ready message", () => {
			const result = clientMessageSchema.safeParse({ type: "ready" });
			expect(result.success).toBe(true);
		});
	});

	describe("kick", () => {
		it("should accept valid kick message", () => {
			const result = clientMessageSchema.safeParse({
				type: "kick",
				payload: { playerId: "player-123" },
			});
			expect(result.success).toBe(true);
		});

		it("should reject empty playerId", () => {
			const result = clientMessageSchema.safeParse({
				type: "kick",
				payload: { playerId: "" },
			});
			expect(result.success).toBe(false);
		});
	});

	describe("rematch", () => {
		it("should accept valid rematch message", () => {
			const result = clientMessageSchema.safeParse({ type: "rematch" });
			expect(result.success).toBe(true);
		});
	});

	describe("invalid messages", () => {
		it("should reject unknown message type", () => {
			const result = clientMessageSchema.safeParse({ type: "unknown" });
			expect(result.success).toBe(false);
		});

		it("should reject null", () => {
			const result = clientMessageSchema.safeParse(null);
			expect(result.success).toBe(false);
		});

		it("should reject string", () => {
			const result = clientMessageSchema.safeParse("not an object");
			expect(result.success).toBe(false);
		});
	});
});
