import {
	BASE_SPEED,
	DIFFICULTY_LEVELS,
	type DifficultyLevel,
	MAX_OBSTACLE_GAP_MS,
	MAX_SPEED,
	MIN_OBSTACLE_GAP_MS,
	SPEED_INCREASE_INTERVAL_MS,
	SPEED_INCREMENT,
} from "@fangdash/shared";

export class DifficultyScaler {
	private timeSinceIncrease = 0;
	currentSpeed = BASE_SPEED;
	private forcedLevelIndex: number | null = null;

	// Runtime-overridable constants (for debug menu)
	overrides: {
		baseSpeed?: number;
		maxSpeed?: number;
		speedIncrement?: number;
		speedIntervalMs?: number;
		minGapMs?: number;
		maxGapMs?: number;
	} = {};

	get currentLevel(): DifficultyLevel {
		if (this.forcedLevelIndex !== null) {
			// biome-ignore lint/style/noNonNullAssertion: array index always valid
			return DIFFICULTY_LEVELS[this.forcedLevelIndex]!;
		}
		const distance = this.distanceFromSpeed();
		for (let i = DIFFICULTY_LEVELS.length - 1; i >= 0; i--) {
			// biome-ignore lint/style/noNonNullAssertion: array index always valid
			if (distance >= DIFFICULTY_LEVELS[i]!.startDistance) {
				// biome-ignore lint/style/noNonNullAssertion: array index always valid
				return DIFFICULTY_LEVELS[i]!;
			}
		}
		// biome-ignore lint/style/noNonNullAssertion: array index always valid
		return DIFFICULTY_LEVELS[0]!;
	}

	forceDifficulty(levelIndex: number | null) {
		if (
			levelIndex !== null &&
			levelIndex >= 0 &&
			levelIndex < DIFFICULTY_LEVELS.length
		) {
			this.forcedLevelIndex = levelIndex;
		} else {
			this.forcedLevelIndex = null;
		}
	}

	get minGap(): number {
		return Math.max(
			400,
			(this.overrides.minGapMs ?? MIN_OBSTACLE_GAP_MS) /
				this.currentLevel.spawnRateMultiplier,
		);
	}

	get maxGap(): number {
		return Math.max(
			800,
			(this.overrides.maxGapMs ?? MAX_OBSTACLE_GAP_MS) /
				this.currentLevel.spawnRateMultiplier,
		);
	}

	get levelName(): string {
		return this.currentLevel.name;
	}

	get speedMultiplier(): number {
		return this.currentLevel.speedMultiplier;
	}

	get spawnRateMultiplier(): number {
		return this.currentLevel.spawnRateMultiplier;
	}

	update(delta: number) {
		this.timeSinceIncrease += delta;

		const intervalMs =
			this.overrides.speedIntervalMs ?? SPEED_INCREASE_INTERVAL_MS;
		if (this.timeSinceIncrease >= intervalMs) {
			this.timeSinceIncrease = 0;
			const maxSpeed = this.overrides.maxSpeed ?? MAX_SPEED;
			const increment = this.overrides.speedIncrement ?? SPEED_INCREMENT;
			this.currentSpeed = Math.min(
				maxSpeed,
				this.currentSpeed + increment * this.currentLevel.speedMultiplier,
			);
		}
	}

	reset() {
		this.currentSpeed = this.overrides.baseSpeed ?? BASE_SPEED;
		this.timeSinceIncrease = 0;
	}

	setStartLevel(name: string) {
		const level = DIFFICULTY_LEVELS.find((l) => l.name === name);
		if (!level) {
			return;
		}
		const baseSpeed = this.overrides.baseSpeed ?? BASE_SPEED;
		const increment = this.overrides.speedIncrement ?? SPEED_INCREMENT;
		this.currentSpeed = baseSpeed + (level.startDistance / 10) * increment;
	}

	private distanceFromSpeed(): number {
		const baseSpeed = this.overrides.baseSpeed ?? BASE_SPEED;
		const increment = this.overrides.speedIncrement ?? SPEED_INCREMENT;
		return ((this.currentSpeed - baseSpeed) / increment) * 10;
	}
}
