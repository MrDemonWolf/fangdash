import { describe, expect, it, beforeEach } from "vitest";
import { DifficultyScaler } from "../systems/DifficultyScaler.ts";
import {
	BASE_SPEED,
	MAX_SPEED,
	SPEED_INCREASE_INTERVAL_MS,
	DIFFICULTY_LEVELS,
} from "@fangdash/shared";

describe("DifficultyScaler", () => {
	let scaler: DifficultyScaler;

	beforeEach(() => {
		scaler = new DifficultyScaler();
	});

	it("should start at base speed", () => {
		expect(scaler.currentSpeed).toBe(BASE_SPEED);
	});

	it("should increase speed after interval", () => {
		scaler.update(SPEED_INCREASE_INTERVAL_MS);
		expect(scaler.currentSpeed).toBeGreaterThan(BASE_SPEED);
	});

	it("should not increase speed before interval", () => {
		scaler.update(SPEED_INCREASE_INTERVAL_MS - 1);
		expect(scaler.currentSpeed).toBe(BASE_SPEED);
	});

	it("should not exceed max speed", () => {
		// Update many times to push past max
		for (let i = 0; i < 1000; i++) {
			scaler.update(SPEED_INCREASE_INTERVAL_MS);
		}
		expect(scaler.currentSpeed).toBeLessThanOrEqual(MAX_SPEED);
	});

	it("should reset to base speed", () => {
		scaler.update(SPEED_INCREASE_INTERVAL_MS * 10);
		scaler.reset();
		expect(scaler.currentSpeed).toBe(BASE_SPEED);
	});

	it("should return first difficulty level at start", () => {
		expect(scaler.currentLevel).toBe(DIFFICULTY_LEVELS[0]);
	});

	it("should progress to higher difficulty levels", () => {
		// Increase speed enough to reach a higher level
		for (let i = 0; i < 200; i++) {
			scaler.update(SPEED_INCREASE_INTERVAL_MS);
		}
		const levelIndex = DIFFICULTY_LEVELS.indexOf(scaler.currentLevel);
		expect(levelIndex).toBeGreaterThan(0);
	});

	it("should force difficulty level", () => {
		const lastIndex = DIFFICULTY_LEVELS.length - 1;
		scaler.forceDifficulty(lastIndex);
		expect(scaler.currentLevel).toBe(DIFFICULTY_LEVELS[lastIndex]);
	});

	it("should clear forced difficulty with null", () => {
		scaler.forceDifficulty(DIFFICULTY_LEVELS.length - 1);
		scaler.forceDifficulty(null);
		expect(scaler.currentLevel).toBe(DIFFICULTY_LEVELS[0]);
	});

	it("should expose level name", () => {
		expect(scaler.levelName).toBe(DIFFICULTY_LEVELS[0]!.name);
	});

	it("should expose speed multiplier", () => {
		expect(scaler.speedMultiplier).toBe(DIFFICULTY_LEVELS[0]!.speedMultiplier);
	});

	it("should expose spawn rate multiplier", () => {
		expect(scaler.spawnRateMultiplier).toBe(DIFFICULTY_LEVELS[0]!.spawnRateMultiplier);
	});

	it("should compute min gap", () => {
		expect(scaler.minGap).toBeGreaterThanOrEqual(400);
	});

	it("should compute max gap", () => {
		expect(scaler.maxGap).toBeGreaterThanOrEqual(800);
	});

	it("should set start level by name", () => {
		const targetLevel = DIFFICULTY_LEVELS[1];
		if (targetLevel) {
			scaler.setStartLevel(targetLevel.name);
			expect(scaler.currentSpeed).toBeGreaterThan(BASE_SPEED);
		}
	});

	it("should ignore invalid start level name", () => {
		scaler.setStartLevel("nonexistent");
		expect(scaler.currentSpeed).toBe(BASE_SPEED);
	});

	it("should respect override values", () => {
		scaler.overrides.maxSpeed = BASE_SPEED + 1;
		scaler.update(SPEED_INCREASE_INTERVAL_MS * 100);
		expect(scaler.currentSpeed).toBeLessThanOrEqual(BASE_SPEED + 1);
	});

	it("should use overridden base speed on reset", () => {
		scaler.overrides.baseSpeed = 500;
		scaler.reset();
		expect(scaler.currentSpeed).toBe(500);
	});
});
