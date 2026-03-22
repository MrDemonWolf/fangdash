import {
	MAX_DURATION_MS,
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
};

export type ScoreValidationResult = { valid: true } | { valid: false; reason: string };

/**
 * Validates a score submission against anti-cheat rules:
 * - Mod bitmask must only contain ready, compatible mods
 * - Duration must not exceed 30 minutes
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

	const modMultiplier = getScoreMultiplier(input.mods);
	const maxAllowedScore =
		((input.duration / 1000) * SCORE_PER_SECOND + input.obstaclesCleared * SCORE_PER_OBSTACLE) *
		modMultiplier;

	if (input.score > maxAllowedScore * 1.1 + 50) {
		return { valid: false, reason: "Score exceeds maximum allowed rate" };
	}

	return { valid: true };
}
