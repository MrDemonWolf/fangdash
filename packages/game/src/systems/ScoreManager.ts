import {
  SCORE_PER_SECOND,
  SCORE_PER_OBSTACLE,
  DISTANCE_MULTIPLIER,
} from "@fangdash/shared";
import type { GameState } from "@fangdash/shared";

export class ScoreManager {
  score = 0;
  distance = 0;
  obstaclesCleared = 0;
  private lastObstacleCount = 0;

  update(delta: number, speed: number, currentObstaclesCleared: number) {
    const dt = delta / 1000;

    // Distance-based score
    this.distance += speed * dt * DISTANCE_MULTIPLIER;
    this.score += SCORE_PER_SECOND * dt;

    // Obstacle clear bonus
    const newClears = currentObstaclesCleared - this.lastObstacleCount;
    if (newClears > 0) {
      this.score += newClears * SCORE_PER_OBSTACLE;
      this.obstaclesCleared += newClears;
      this.lastObstacleCount = currentObstaclesCleared;
    }
  }

  getState(alive: boolean, speed: number): GameState {
    return {
      score: Math.floor(this.score),
      distance: Math.floor(this.distance),
      obstaclesCleared: this.obstaclesCleared,
      alive,
      speed,
    };
  }

  reset() {
    this.score = 0;
    this.distance = 0;
    this.obstaclesCleared = 0;
    this.lastObstacleCount = 0;
  }
}
