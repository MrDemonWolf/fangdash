import {
	DISTANCE_MULTIPLIER,
	MAX_DURATION_MS,
	MAX_SPEED,
	MIN_OBSTACLE_GAP_FLOOR_MS,
	READY_MODS_MASK,
	SCORE_PER_OBSTACLE,
	SCORE_PER_SECOND,
	areModsCompatible,
	getScoreMultiplier,
} from "@fangdash/shared";

export type ScoreValidationInput = {
	mods: number;
	duration: number;
	score: number;
	obstaclesCleared: number;
	distance: number;
};

export type ScoreValidationResult = { valid: true } | { valid: false; reason: string };

/**
 * Validates a score submission against anti-cheat rules:
 * - Mod bitmask must only contain ready, compatible mods
 * - Duration must not exceed 30 minutes
 * - Obstacles cleared must not exceed the engine's fastest spawn floor (400ms gap, with 10% + 5 buffer)
 * - Distance must not exceed max speed over the duration (with 10% + 50 buffer)
 * - Score must not exceed the theoretical maximum (with 10% + 50 buffer for frame-timing drift)
 */
export function validateScoreInput(input: ScoreValidationInput): ScoreValidationResult {
	if ((input.mods & ~READY_MODS_MASK) !== 0) {
		return { valid: false, reason: "Invalid mod flags: contains non-ready mods" };
	}
	if (!areModsCompatible(input.mods)) {
		return { valid: false, reason: "Invalid mod flags: incompatible mod combination" };
	}

	if (input.duration > MAX_DURATION_MS) {
		return { valid: false, reason: "Game session exceeds maximum allowed duration" };
	}

	if (input.obstaclesCleared > (input.duration / MIN_OBSTACLE_GAP_FLOOR_MS) * 1.1 + 5) {
		return { valid: false, reason: "Obstacles cleared exceeds maximum possible rate" };
	}

	if (input.distance > (input.duration / 1000) * MAX_SPEED * DISTANCE_MULTIPLIER * 1.1 + 50) {
		return { valid: false, reason: "Distance exceeds maximum possible rate" };
	}

	const modMultiplier = getScoreMultiplier(input.mods);
	const maxAllowedScore =
		((input.duration / 1000) * SCORE_PER_SECOND + input.obstaclesCleared * SCORE_PER_OBSTACLE) *
		modMultiplier;

	if (input.score > maxAllowedScore * 1.1 + 50) {
		return { valid: false, reason: "Score exceeds maximum allowed rate" };
	}

	return { valid: true };
}
