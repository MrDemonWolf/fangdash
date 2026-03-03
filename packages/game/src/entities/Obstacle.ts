import Phaser from "phaser";
import {
  GAME_WIDTH,
  GROUND_Y,
  OBSTACLE_TYPES,
  type ObstacleType,
} from "@fangdash/shared";

export interface ObstacleConfig {
  type: ObstacleType;
  width: number;
  height: number;
}

const OBSTACLE_CONFIGS: Record<ObstacleType, { width: number; height: number }> = {
  rock: { width: 30, height: 30 },
  log: { width: 50, height: 25 },
  bush: { width: 35, height: 28 },
  spike: { width: 20, height: 40 },
};

const OBSTACLE_SCALE = 2;

export class Obstacle {
  sprite: Phaser.GameObjects.Sprite;
  type: ObstacleType;
  active = false;
  private config: { width: number; height: number };

  constructor(scene: Phaser.Scene, type: ObstacleType) {
    this.type = type;
    this.config = OBSTACLE_CONFIGS[type];
    this.sprite = scene.add.sprite(-100, 0, `obstacle-${type}`);
    this.sprite.setOrigin(0.5, 1);
    this.sprite.setScale(OBSTACLE_SCALE);
    this.applyNearestFilter();
    this.sprite.setVisible(false);
  }

  get bounds(): Phaser.Geom.Rectangle {
    const scaledW = this.config.width * OBSTACLE_SCALE;
    const scaledH = this.config.height * OBSTACLE_SCALE;
    return new Phaser.Geom.Rectangle(
      this.sprite.x - scaledW / 2 + 2,
      this.sprite.y - scaledH + 2,
      scaledW - 4,
      scaledH - 4
    );
  }

  setType(type: ObstacleType) {
    this.type = type;
    this.config = OBSTACLE_CONFIGS[type];
    this.sprite.setTexture(`obstacle-${type}`);
    this.applyNearestFilter();
  }

  private applyNearestFilter() {
    this.sprite.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  }

  spawn(x?: number) {
    this.active = true;
    this.sprite.setVisible(true);
    this.sprite.x = x ?? GAME_WIDTH + 50;
    this.sprite.y = GROUND_Y;
  }

  update(speed: number, delta: number) {
    if (!this.active) return;

    const dt = delta / 1000;
    this.sprite.x -= speed * dt;

    if (this.sprite.x < -60) {
      this.deactivate();
    }
  }

  deactivate() {
    this.active = false;
    this.sprite.setVisible(false);
    this.sprite.x = -100;
  }
}

export class ObstacleSpawner {
  private pool: Obstacle[] = [];
  private scene: Phaser.Scene;
  private timeSinceLastSpawn = 0;
  private nextSpawnTime = 1500;
  obstaclesCleared = 0;

  constructor(scene: Phaser.Scene, poolSize = 10) {
    this.scene = scene;
    for (let i = 0; i < poolSize; i++) {
      const type = OBSTACLE_TYPES[i % OBSTACLE_TYPES.length];
      this.pool.push(new Obstacle(scene, type));
    }
  }

  update(speed: number, delta: number, minGap: number, maxGap: number) {
    this.timeSinceLastSpawn += delta;

    if (this.timeSinceLastSpawn >= this.nextSpawnTime) {
      this.spawn();
      this.timeSinceLastSpawn = 0;
      this.nextSpawnTime = Phaser.Math.Between(minGap, maxGap);
    }

    for (const obstacle of this.pool) {
      const wasActive = obstacle.active;
      obstacle.update(speed, delta);
      if (wasActive && !obstacle.active) {
        this.obstaclesCleared++;
      }
    }
  }

  getActiveObstacles(): Obstacle[] {
    return this.pool.filter((o) => o.active);
  }

  private spawn() {
    const inactive = this.pool.find((o) => !o.active);
    if (!inactive) return;

    const type = OBSTACLE_TYPES[Phaser.Math.Between(0, OBSTACLE_TYPES.length - 1)];
    inactive.setType(type);
    inactive.spawn();
  }

  reset() {
    this.timeSinceLastSpawn = 0;
    this.nextSpawnTime = 1500;
    this.obstaclesCleared = 0;
    for (const obstacle of this.pool) {
      obstacle.deactivate();
    }
  }
}
