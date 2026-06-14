import { describe, expect, it } from "vitest";
import { RACE_TOKEN_TTL_SECONDS, signRaceToken, verifyRaceToken } from "../race-token.ts";

const SECRET = "test-race-token-secret-do-not-use-in-prod";

describe("race-token", () => {
	describe("signRaceToken", () => {
		it("produces a two-part base64url token", async () => {
			const token = await signRaceToken("user-123", SECRET);
			const parts = token.split(".");
			expect(parts).toHaveLength(2);
			// base64url: no +, /, or = padding
			expect(token).not.toMatch(/[+/=]/);
		});

		it("throws when the secret is empty", async () => {
			await expect(signRaceToken("user-123", "")).rejects.toThrow(/secret/);
		});

		it("throws when the user id is empty", async () => {
			await expect(signRaceToken("", SECRET)).rejects.toThrow(/userId/);
		});

		it("defaults expiry to RACE_TOKEN_TTL_SECONDS from now", async () => {
			const now = 1_000_000;
			const token = await signRaceToken("user-123", SECRET, { nowSeconds: now });
			const [encodedPayload] = token.split(".");
			const payload = JSON.parse(
				Buffer.from(
					(encodedPayload as string).replace(/-/g, "+").replace(/_/g, "/"),
					"base64",
				).toString("utf8"),
			);
			expect(payload.exp).toBe(now + RACE_TOKEN_TTL_SECONDS);
		});
	});

	describe("verifyRaceToken — happy path", () => {
		it("round-trips a freshly minted token and returns the userId", async () => {
			const token = await signRaceToken("user-abc", SECRET);
			const result = await verifyRaceToken(token, SECRET);
			expect(result).toEqual({ userId: "user-abc" });
		});

		it("accepts a token that has not yet expired", async () => {
			const now = 5_000;
			const token = await signRaceToken("user-abc", SECRET, {
				ttlSeconds: 60,
				nowSeconds: now,
			});
			const result = await verifyRaceToken(token, SECRET, { nowSeconds: now + 59 });
			expect(result).toEqual({ userId: "user-abc" });
		});

		it("preserves user ids containing dots and unicode", async () => {
			const userId = "user.with.dots.🐺";
			const token = await signRaceToken(userId, SECRET);
			const result = await verifyRaceToken(token, SECRET);
			expect(result).toEqual({ userId });
		});
	});

	describe("verifyRaceToken — expired", () => {
		it("rejects a token whose exp is in the past", async () => {
			const now = 5_000;
			const token = await signRaceToken("user-abc", SECRET, {
				ttlSeconds: 60,
				nowSeconds: now,
			});
			const result = await verifyRaceToken(token, SECRET, { nowSeconds: now + 61 });
			expect(result).toBeNull();
		});

		it("rejects exactly one second after expiry", async () => {
			const now = 0;
			const token = await signRaceToken("user-abc", SECRET, {
				ttlSeconds: 10,
				nowSeconds: now,
			});
			// exp = 10; now = 11 → expired
			expect(await verifyRaceToken(token, SECRET, { nowSeconds: 11 })).toBeNull();
			// exp = 10; now = 10 → still valid (exp < now is the reject condition)
			expect(await verifyRaceToken(token, SECRET, { nowSeconds: 10 })).toEqual({
				userId: "user-abc",
			});
		});
	});

	describe("verifyRaceToken — tampered / invalid", () => {
		it("rejects a token signed with a different secret", async () => {
			const token = await signRaceToken("user-abc", SECRET);
			const result = await verifyRaceToken(token, "a-different-secret");
			expect(result).toBeNull();
		});

		it("rejects a token with a mutated payload but original signature", async () => {
			const token = await signRaceToken("user-abc", SECRET);
			const signature = token.split(".")[1] as string;
			const forgedPayload = Buffer.from(
				JSON.stringify({ sub: "attacker", exp: 9_999_999_999 }),
				"utf8",
			)
				.toString("base64")
				.replace(/\+/g, "-")
				.replace(/\//g, "_")
				.replace(/=+$/, "");
			const forged = `${forgedPayload}.${signature}`;
			expect(await verifyRaceToken(forged, SECRET)).toBeNull();
		});

		it("rejects a token with a flipped signature byte", async () => {
			const token = await signRaceToken("user-abc", SECRET);
			const [payload, signature] = token.split(".") as [string, string];
			const lastChar = signature.at(-1) === "A" ? "B" : "A";
			const tampered = `${payload}.${signature.slice(0, -1)}${lastChar}`;
			expect(await verifyRaceToken(tampered, SECRET)).toBeNull();
		});

		it("rejects malformed tokens without throwing", async () => {
			for (const bad of ["", "no-dot", "a.b.c", "...", "x."]) {
				expect(await verifyRaceToken(bad, SECRET)).toBeNull();
			}
		});

		it("rejects null/undefined token", async () => {
			expect(await verifyRaceToken(null, SECRET)).toBeNull();
			expect(await verifyRaceToken(undefined, SECRET)).toBeNull();
		});

		it("rejects when no secret is configured", async () => {
			const token = await signRaceToken("user-abc", SECRET);
			expect(await verifyRaceToken(token, "")).toBeNull();
		});
	});
});
