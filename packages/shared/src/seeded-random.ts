/**
 * Deterministic PRNG using mulberry32 algorithm.
 * Given the same seed, always produces the same sequence.
 */
export class SeededRandom {
	private state: number;

	constructor(seed: string | number) {
		this.state =
			typeof seed === "string" ? SeededRandom.hashString(seed) : seed;
	}

	/** Returns a float in [0, 1) */
	next(): number {
		this.state |= 0;
		this.state = (this.state + 0x6d2b79f5) | 0;
		let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
		t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	}

	/** Returns a float in [min, max) */
	between(min: number, max: number): number {
		return min + this.next() * (max - min);
	}

	/** Returns an integer in [min, max] (inclusive) */
	intBetween(min: number, max: number): number {
		return Math.floor(this.between(min, max + 1));
	}

	/** Picks a random element from the array */
	pick<T>(array: readonly T[]): T {
		// Index is always valid: next() returns [0, 1), so floor(next() * length) is in [0, length-1]
		// biome-ignore lint/style/noNonNullAssertion: array index always valid
		return array[Math.floor(this.next() * array.length)]!;
	}

	/** Simple string hash (djb2) */
	private static hashString(str: string): number {
		let hash = 5381;
		for (let i = 0; i < str.length; i++) {
			hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
		}
		return hash >>> 0;
	}
}
