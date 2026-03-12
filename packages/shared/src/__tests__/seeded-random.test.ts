// biome-ignore lint/correctness/noUndeclaredDependencies: vitest is a workspace root dependency
import { describe, expect, it } from "vitest";
import { SeededRandom } from "../seeded-random.ts";

describe("SeededRandom", () => {
	it("produces deterministic sequences from the same string seed", () => {
		const a = new SeededRandom("test-seed");
		const b = new SeededRandom("test-seed");

		const seqA = Array.from({ length: 10 }, () => a.next());
		const seqB = Array.from({ length: 10 }, () => b.next());

		expect(seqA).toEqual(seqB);
	});

	it("produces deterministic sequences from the same numeric seed", () => {
		const a = new SeededRandom(42);
		const b = new SeededRandom(42);

		expect(a.next()).toBe(b.next());
		expect(a.next()).toBe(b.next());
	});

	it("produces different sequences from different seeds", () => {
		const a = new SeededRandom("seed-a");
		const b = new SeededRandom("seed-b");

		const seqA = Array.from({ length: 5 }, () => a.next());
		const seqB = Array.from({ length: 5 }, () => b.next());

		expect(seqA).not.toEqual(seqB);
	});

	it("next() returns values in [0, 1)", () => {
		const rng = new SeededRandom("bounds-test");
		for (let i = 0; i < 1000; i++) {
			const val = rng.next();
			expect(val).toBeGreaterThanOrEqual(0);
			expect(val).toBeLessThan(1);
		}
	});

	it("between() returns values in [min, max)", () => {
		const rng = new SeededRandom("between-test");
		for (let i = 0; i < 100; i++) {
			const val = rng.between(5, 10);
			expect(val).toBeGreaterThanOrEqual(5);
			expect(val).toBeLessThan(10);
		}
	});

	it("intBetween() returns integers in [min, max]", () => {
		const rng = new SeededRandom("int-test");
		const seen = new Set<number>();
		for (let i = 0; i < 200; i++) {
			const val = rng.intBetween(1, 3);
			expect(val).toBeGreaterThanOrEqual(1);
			expect(val).toBeLessThanOrEqual(3);
			expect(Number.isInteger(val)).toBe(true);
			seen.add(val);
		}
		// Should eventually see all values 1, 2, 3
		expect(seen.size).toBe(3);
	});

	it("pick() returns items from the array", () => {
		const rng = new SeededRandom("pick-test");
		const items = ["a", "b", "c"] as const;
		for (let i = 0; i < 50; i++) {
			const val = rng.pick(items);
			expect(items).toContain(val);
		}
	});
});
