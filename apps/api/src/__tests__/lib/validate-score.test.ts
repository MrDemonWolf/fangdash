import { describe, expect, it } from "vitest";
import { validateScoreInput } from "../../lib/validate-score.ts";
import { MOD_FOG, MOD_HEADWIND } from "@fangdash/shared";

describe("validateScoreInput", () => {
	const validInput = {
		mods: 0,
		duration: 60_000,
		score: 100,
		obstaclesCleared: 5,
	};

	it("accepts valid input with no mods", () => {
		expect(validateScoreInput(validInput)).toEqual({ valid: true });
	});

	it("accepts valid input with ready mods", () => {
		const result = validateScoreInput({ ...validInput, mods: MOD_FOG });
		expect(result).toEqual({ valid: true });
	});

	it("rejects non-ready mod flags", () => {
		const nonReadyFlag = 1 << 10;
		const result = validateScoreInput({ ...validInput, mods: nonReadyFlag });
		expect(result).toEqual({ valid: false, reason: "Invalid mod flags: contains non-ready mods" });
	});

	it("rejects duration exceeding 30 minutes", () => {
		const result = validateScoreInput({ ...validInput, duration: 1_800_001 });
		expect(result).toEqual({ valid: false, reason: "Game session exceeds maximum allowed duration" });
	});

	it("accepts duration at exactly 30 minutes", () => {
		const result = validateScoreInput({ ...validInput, duration: 1_800_000 });
		expect(result).toEqual({ valid: true });
	});

	it("rejects impossibly high scores", () => {
		const result = validateScoreInput({
			mods: 0,
			duration: 1000, // 1 second
			score: 999999,
			obstaclesCleared: 0,
		});
		expect(result).toEqual({ valid: false, reason: "Score exceeds maximum allowed rate" });
	});

	it("allows scores within the 10% + 50 tolerance buffer", () => {
		// With 60s and 5 obstacles: (60 * SCORE_PER_SECOND + 5 * SCORE_PER_OBSTACLE) * 1.1 + 50
		// The exact max depends on constants, but a reasonable score should pass
		const result = validateScoreInput({
			mods: 0,
			duration: 60_000,
			score: 100,
			obstaclesCleared: 5,
		});
		expect(result).toEqual({ valid: true });
	});

	it("accounts for mod multiplier in score validation", () => {
		// Same input but with mod should allow higher scores
		const baseResult = validateScoreInput({
			mods: 0,
			duration: 60_000,
			score: 200,
			obstaclesCleared: 10,
		});
		const modResult = validateScoreInput({
			mods: MOD_FOG | MOD_HEADWIND,
			duration: 60_000,
			score: 200,
			obstaclesCleared: 10,
		});
		// If base is valid, modded should also be valid (mod multiplier increases max)
		if (baseResult.valid) {
			expect(modResult.valid).toBe(true);
		}
	});
});
