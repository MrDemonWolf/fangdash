import { describe, expect, it } from "vitest";
import {
	MOD_NONE,
	MOD_FOG,
	MOD_HEADWIND,
	MOD_TREMOR,
	MOD_DEFINITIONS,
	READY_MODS_MASK,
	encodeMods,
	decodeMods,
	getScoreMultiplier,
	areModsCompatible,
	hasmod,
	getModById,
	formatModNames,
	areAllModsReady,
} from "../mods.ts";

describe("mods", () => {
	describe("constants", () => {
		it("MOD_NONE is 0", () => {
			expect(MOD_NONE).toBe(0);
		});

		it("flags are unique powers of two", () => {
			const flags = [MOD_FOG, MOD_HEADWIND, MOD_TREMOR];
			for (const f of flags) {
				expect(f & (f - 1)).toBe(0); // power of two check
				expect(f).toBeGreaterThan(0);
			}
			// no overlaps
			const combined = flags.reduce((a, b) => a | b, 0);
			expect(combined).toBe(MOD_FOG + MOD_HEADWIND + MOD_TREMOR);
		});

		it("READY_MODS_MASK includes all ready mods", () => {
			for (const mod of MOD_DEFINITIONS) {
				if (mod.ready) {
					expect(READY_MODS_MASK & mod.flag).toBe(mod.flag);
				}
			}
		});
	});

	describe("encodeMods", () => {
		it("returns 0 for empty array", () => {
			expect(encodeMods([])).toBe(0);
		});

		it("encodes a single mod", () => {
			expect(encodeMods(["fog"])).toBe(MOD_FOG);
		});

		it("encodes multiple mods", () => {
			expect(encodeMods(["fog", "headwind"])).toBe(MOD_FOG | MOD_HEADWIND);
		});

		it("encodes all mods", () => {
			expect(encodeMods(["fog", "headwind", "tremor"])).toBe(MOD_FOG | MOD_HEADWIND | MOD_TREMOR);
		});
	});

	describe("decodeMods", () => {
		it("returns empty array for 0", () => {
			expect(decodeMods(0)).toEqual([]);
		});

		it("decodes a single mod", () => {
			const result = decodeMods(MOD_FOG);
			expect(result).toHaveLength(1);
			expect(result[0]).toBeDefined();
			expect(result[0]?.id).toBe("fog");
		});

		it("decodes multiple mods", () => {
			const result = decodeMods(MOD_FOG | MOD_TREMOR);
			expect(result).toHaveLength(2);
			const ids = result.map((m) => m.id);
			expect(ids).toContain("fog");
			expect(ids).toContain("tremor");
		});
	});

	describe("getScoreMultiplier", () => {
		it("returns 1.0 for no mods", () => {
			expect(getScoreMultiplier(0)).toBe(1.0);
		});

		it("returns single mod multiplier", () => {
			expect(getScoreMultiplier(MOD_FOG)).toBe(1.15);
		});

		it("compounds multipliers for multiple mods", () => {
			const result = getScoreMultiplier(MOD_FOG | MOD_HEADWIND);
			// 1.15 * 1.15 = 1.3225, rounded to 3 decimals
			expect(result).toBe(1.322);
		});
	});

	describe("areModsCompatible", () => {
		it("returns true for no mods", () => {
			expect(areModsCompatible(0)).toBe(true);
		});

		it("returns true for single mods", () => {
			expect(areModsCompatible(MOD_FOG)).toBe(true);
			expect(areModsCompatible(MOD_HEADWIND)).toBe(true);
		});

		it("returns true for all current mods combined", () => {
			expect(areModsCompatible(MOD_FOG | MOD_HEADWIND | MOD_TREMOR)).toBe(true);
		});
	});

	describe("hasmod", () => {
		it("returns false when mod is not set", () => {
			expect(hasmod(0, MOD_FOG)).toBe(false);
		});

		it("returns true when mod is set", () => {
			expect(hasmod(MOD_FOG | MOD_HEADWIND, MOD_FOG)).toBe(true);
		});

		it("returns false for a different mod", () => {
			expect(hasmod(MOD_FOG, MOD_HEADWIND)).toBe(false);
		});
	});

	describe("getModById", () => {
		it("returns mod definition for valid id", () => {
			const mod = getModById("fog");
			expect(mod).toBeDefined();
			expect(mod?.flag).toBe(MOD_FOG);
			expect(mod?.name).toBe("Fog");
		});

		it("returns undefined for invalid id", () => {
			expect(getModById("nonexistent")).toBeUndefined();
		});
	});

	describe("formatModNames", () => {
		it("returns 'No Mods' for 0", () => {
			expect(formatModNames(0)).toBe("No Mods");
		});

		it("returns single mod name", () => {
			expect(formatModNames(MOD_FOG)).toBe("Fog");
		});

		it("joins multiple mod names with +", () => {
			const result = formatModNames(MOD_FOG | MOD_HEADWIND);
			expect(result).toContain("Fog");
			expect(result).toContain("Headwind");
			expect(result).toContain(" + ");
		});
	});

	describe("areAllModsReady", () => {
		it("returns true for no mods", () => {
			expect(areAllModsReady(0)).toBe(true);
		});

		it("returns true for ready mods", () => {
			expect(areAllModsReady(MOD_FOG)).toBe(true);
			expect(areAllModsReady(MOD_FOG | MOD_HEADWIND | MOD_TREMOR)).toBe(true);
		});

		it("returns false for non-ready mod flags", () => {
			// Use a flag outside the ready mask
			const nonReadyFlag = 1 << 10;
			expect(areAllModsReady(nonReadyFlag)).toBe(false);
		});
	});
});
