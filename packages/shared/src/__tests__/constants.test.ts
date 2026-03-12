import { describe, expect, it } from "vitest";
import {
	BASE_SPEED,
	DIFFICULTY_LEVELS,
	GAME_HEIGHT,
	GAME_WIDTH,
	GRAVITY,
	GROUND_Y,
	JUMP_VELOCITY,
	MAX_SPEED,
	OBSTACLE_TYPES,
} from "../constants.ts";

describe("Constants", () => {
	it("gravity is positive (pulls down)", () => {
		expect(GRAVITY).toBeGreaterThan(0);
	});

	it("jump velocity is negative (goes up)", () => {
		expect(JUMP_VELOCITY).toBeLessThan(0);
	});

	it("max speed is greater than base speed", () => {
		expect(MAX_SPEED).toBeGreaterThan(BASE_SPEED);
	});

	it("game dimensions are positive", () => {
		expect(GAME_WIDTH).toBeGreaterThan(0);
		expect(GAME_HEIGHT).toBeGreaterThan(0);
	});

	it("ground Y is within game height", () => {
		expect(GROUND_Y).toBeGreaterThan(0);
		expect(GROUND_Y).toBeLessThan(GAME_HEIGHT);
	});

	it("obstacle types are non-empty", () => {
		expect(OBSTACLE_TYPES.length).toBeGreaterThan(0);
	});

	it("difficulty levels are sorted by startDistance", () => {
		for (let i = 1; i < DIFFICULTY_LEVELS.length; i++) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			expect(DIFFICULTY_LEVELS[i]!.startDistance).toBeGreaterThan(
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				DIFFICULTY_LEVELS[i - 1]!.startDistance,
			);
		}
	});

	it("difficulty speed multipliers increase", () => {
		for (let i = 1; i < DIFFICULTY_LEVELS.length; i++) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			expect(DIFFICULTY_LEVELS[i]!.speedMultiplier).toBeGreaterThanOrEqual(
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				DIFFICULTY_LEVELS[i - 1]!.speedMultiplier,
			);
		}
	});
});
