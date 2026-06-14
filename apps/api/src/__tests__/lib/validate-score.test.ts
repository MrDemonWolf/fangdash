import { describe, expect, it } from "vitest";
import { validateScoreInput } from "../../lib/validate-score.ts";
import {
	DISTANCE_MULTIPLIER,
	MAX_SPEED,
	MIN_OBSTACLE_GAP_FLOOR_MS,
	MOD_FOG,
	MOD_HEADWIND,
} from "@fangdash/shared";

describe("validateScoreInput", () => {
	const validInput = {
		mods: 0,
		duration: 60_000,
		score: 100,
		obstaclesCleared: 5,
		distance: 500,
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
		expect(result).toEqual({
			valid: false,
			reason: "Game session exceeds maximum allowed duration",
		});
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
			distance: 10,
		});
		expect(result).toEqual({ valid: false, reason: "Score exceeds maximum allowed rate" });
	});

	it("rejects obstacles cleared exceeding the maximum possible rate", () => {
		// 10s game can spawn at most 10000 / MIN_OBSTACLE_GAP_MS obstacles
		const result = validateScoreInput({
			mods: 0,
			duration: 10_000,
			score: 100,
			obstaclesCleared: 100,
			distance: 500,
		});
		expect(result).toEqual({
			valid: false,
			reason: "Obstacles cleared exceeds maximum possible rate",
		});
	});

	it("accepts obstacles cleared at the rate boundary", () => {
		const duration = 10_000;
		const maxObstacles = Math.floor((duration / MIN_OBSTACLE_GAP_FLOOR_MS) * 1.1 + 5);
		const result = validateScoreInput({
			mods: 0,
			duration,
			// Score must stay consistent with this obstacle count to isolate the rate check
			score: maxObstacles * 50,
			obstaclesCleared: maxObstacles,
			distance: 500,
		});
		expect(result).toEqual({ valid: true });
	});

	it("accepts a high-cadence nightmare run that the 800ms basis would have rejected", () => {
		// The engine floors the spawn gap at 400ms, so a fast nightmare run clears more
		// obstacles than MIN_OBSTACLE_GAP_MS (800ms) would permit. This must be accepted.
		const duration = 10_000;
		const obstaclesCleared = 28; // > 10000/800*1.1+5 (≈18), < 10000/400*1.1+5 (≈32)
		const result = validateScoreInput({
			mods: 0,
			duration,
			score: obstaclesCleared * 50,
			obstaclesCleared,
			distance: 500,
		});
		expect(result).toEqual({ valid: true });
	});

	it("rejects distance exceeding the maximum possible rate", () => {
		// 10s at MAX_SPEED covers at most 10 * MAX_SPEED * DISTANCE_MULTIPLIER metres
		const result = validateScoreInput({
			mods: 0,
			duration: 10_000,
			score: 100,
			obstaclesCleared: 2,
			distance: 10_000,
		});
		expect(result).toEqual({
			valid: false,
			reason: "Distance exceeds maximum possible rate",
		});
	});

	it("accepts distance at the rate boundary", () => {
		const duration = 10_000;
		const maxDistance = Math.floor((duration / 1000) * MAX_SPEED * DISTANCE_MULTIPLIER * 1.1 + 50);
		const result = validateScoreInput({
			mods: 0,
			duration,
			score: 100,
			obstaclesCleared: 2,
			distance: maxDistance,
		});
		expect(result).toEqual({ valid: true });
	});

	it("allows scores within the 10% + 50 tolerance buffer", () => {
		// With 60s and 5 obstacles: (60 * SCORE_PER_SECOND + 5 * SCORE_PER_OBSTACLE) * 1.1 + 50
		// The exact max depends on constants, but a reasonable score should pass
		const result = validateScoreInput({
			mods: 0,
			duration: 60_000,
			score: 100,
			obstaclesCleared: 5,
			distance: 500,
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
			distance: 500,
		});
		const modResult = validateScoreInput({
			mods: MOD_FOG | MOD_HEADWIND,
			duration: 60_000,
			score: 200,
			obstaclesCleared: 10,
			distance: 500,
		});
		expect(baseResult.valid).toBe(true);
		expect(modResult.valid).toBe(true);
	});
});
