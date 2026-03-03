import {
  BASE_SPEED,
  MAX_SPEED,
  SPEED_INCREMENT,
  SPEED_INCREASE_INTERVAL_MS,
  MIN_OBSTACLE_GAP_MS,
  MAX_OBSTACLE_GAP_MS,
  DIFFICULTY_LEVELS,
} from "@fangdash/shared";

export class DifficultyScaler {
  private timeSinceIncrease = 0;
  currentSpeed = BASE_SPEED;
  private forcedLevelIndex: number | null = null;

  get currentLevel() {
    if (this.forcedLevelIndex !== null) {
      return DIFFICULTY_LEVELS[this.forcedLevelIndex];
    }
    const distance = this.distanceFromSpeed();
    for (let i = DIFFICULTY_LEVELS.length - 1; i >= 0; i--) {
      if (distance >= DIFFICULTY_LEVELS[i].startDistance) {
        return DIFFICULTY_LEVELS[i];
      }
    }
    return DIFFICULTY_LEVELS[0];
  }

  forceDifficulty(levelIndex: number | null) {
    if (levelIndex !== null && levelIndex >= 0 && levelIndex < DIFFICULTY_LEVELS.length) {
      this.forcedLevelIndex = levelIndex;
    } else {
      this.forcedLevelIndex = null;
    }
  }

  get minGap(): number {
    return Math.max(400, MIN_OBSTACLE_GAP_MS / this.currentLevel.spawnRateMultiplier);
  }

  get maxGap(): number {
    return Math.max(800, MAX_OBSTACLE_GAP_MS / this.currentLevel.spawnRateMultiplier);
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

    if (this.timeSinceIncrease >= SPEED_INCREASE_INTERVAL_MS) {
      this.timeSinceIncrease = 0;
      this.currentSpeed = Math.min(
        MAX_SPEED,
        this.currentSpeed + SPEED_INCREMENT * this.currentLevel.speedMultiplier
      );
    }
  }

  reset() {
    this.currentSpeed = BASE_SPEED;
    this.timeSinceIncrease = 0;
  }

  private distanceFromSpeed(): number {
    // Rough approximation of distance based on how fast we've ramped
    return ((this.currentSpeed - BASE_SPEED) / SPEED_INCREMENT) * 10;
  }
}
