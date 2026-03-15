import { describe, expect, it, beforeEach } from "vitest";
import { ScoreManager } from "../systems/ScoreManager.ts";
import { SCORE_PER_SECOND, SCORE_PER_OBSTACLE, DISTANCE_MULTIPLIER } from "@fangdash/shared";

describe("ScoreManager", () => {
	let manager: ScoreManager;

	beforeEach(() => {
		manager = new ScoreManager();
	});

	it("should start with zero values", () => {
		expect(manager.score).toBe(0);
		expect(manager.distance).toBe(0);
		expect(manager.obstaclesCleared).toBe(0);
		expect(manager.longestCleanRun).toBe(0);
	});

	it("should accumulate distance based on speed and delta", () => {
		manager.update(1000, 100, 0); // 1 second at speed 100
		expect(manager.distance).toBeCloseTo(100 * DISTANCE_MULTIPLIER, 1);
	});

	it("should accumulate score over time", () => {
		manager.update(1000, 100, 0); // 1 second
		expect(manager.score).toBeCloseTo(SCORE_PER_SECOND, 1);
	});

	it("should award obstacle bonus", () => {
		manager.update(1000, 100, 0);
		const scoreBefore = manager.score;
		manager.update(1000, 100, 3); // 3 new obstacles cleared
		expect(manager.score).toBeCloseTo(scoreBefore + SCORE_PER_SECOND + 3 * SCORE_PER_OBSTACLE, 1);
		expect(manager.obstaclesCleared).toBe(3);
	});

	it("should track cumulative obstacles", () => {
		manager.update(1000, 100, 2);
		manager.update(1000, 100, 5);
		expect(manager.obstaclesCleared).toBe(5);
	});

	it("should track longest clean run", () => {
		manager.update(1000, 100, 0);
		expect(manager.longestCleanRun).toBeGreaterThan(0);
		const run = manager.longestCleanRun;
		manager.update(1000, 100, 0);
		expect(manager.longestCleanRun).toBeGreaterThan(run);
	});

	it("should reset all values", () => {
		manager.update(1000, 100, 5);
		manager.reset();
		expect(manager.score).toBe(0);
		expect(manager.distance).toBe(0);
		expect(manager.obstaclesCleared).toBe(0);
		expect(manager.longestCleanRun).toBe(0);
	});

	it("should return correct game state", () => {
		manager.update(2000, 150, 3);
		const state = manager.getState(true, 150);
		expect(state.alive).toBe(true);
		expect(state.speed).toBe(150);
		expect(state.score).toBe(Math.floor(manager.score));
		expect(state.distance).toBe(Math.floor(manager.distance));
		expect(state.obstaclesCleared).toBe(3);
	});

	it("should respect override values", () => {
		manager.overrides.scorePerSecond = 100;
		manager.update(1000, 100, 0);
		expect(manager.score).toBeCloseTo(100, 1);
	});

	it("should respect distance multiplier override", () => {
		manager.overrides.distanceMultiplier = 2;
		manager.update(1000, 100, 0);
		expect(manager.distance).toBeCloseTo(100 * 2, 1);
	});

	it("should handle zero delta", () => {
		manager.update(0, 100, 0);
		expect(manager.score).toBe(0);
		expect(manager.distance).toBe(0);
	});
});
