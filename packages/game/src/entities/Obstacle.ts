import * as Phaser from "phaser";
import {
  GAME_WIDTH,
  GROUND_Y,
  OBSTACLE_TYPES,
  SeededRandom,
  type ObstacleType,
} from "@fangdash/shared";

const OBSTACLE_SCALE = 2;

export class Obstacle {
  sprite: Phaser.GameObjects.Sprite;
  type: ObstacleType;
  active = false;
  private _boundsRect = new Phaser.Geom.Rectangle(0, 0, 0, 0);

  constructor(scene: Phaser.Scene, type: ObstacleType) {
    this.type = type;
    this.sprite = scene.add.sprite(-100, 0, `obstacle-${type}`);
    this.sprite.setOrigin(0.5, 1);
    this.sprite.setScale(OBSTACLE_SCALE);
    this.applyNearestFilter();
    this.sprite.setVisible(false);
  }

  get bounds(): Phaser.Geom.Rectangle {
    const inset = 6 * OBSTACLE_SCALE;  // scale-aware: 12px per side at 2x scale
    const w = this.sprite.displayWidth;
    const h = this.sprite.displayHeight;
    this._boundsRect.setTo(
      this.sprite.x - w / 2 + inset,
      this.sprite.y - h + inset,
      w - inset * 2,
      h - inset * 2
    );
    return this._boundsRect;
  }

  setType(type: ObstacleType) {
    this.type = type;
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
  private rng: SeededRandom | null = null;
  private timeSinceLastSpawn = 0;
  private nextSpawnTime = 1500;
  obstaclesCleared = 0;

  constructor(scene: Phaser.Scene, poolSize = 10, seed?: string) {
    this.scene = scene;
    if (seed) {
      this.rng = new SeededRandom(seed);
    }
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
      this.nextSpawnTime = this.rng
        ? this.rng.intBetween(minGap, maxGap)
        : Phaser.Math.Between(minGap, maxGap);
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

  get currentTimeSinceLastSpawn(): number {
    return this.timeSinceLastSpawn;
  }

  get currentNextSpawnTime(): number {
    return this.nextSpawnTime;
  }

  get activeObstacleCount(): number {
    return this.pool.filter((o) => o.active).length;
  }

  private spawn() {
    const inactive = this.pool.find((o) => !o.active);
    if (!inactive) return;

    const type = this.rng
      ? this.rng.pick(OBSTACLE_TYPES)
      : OBSTACLE_TYPES[Phaser.Math.Between(0, OBSTACLE_TYPES.length - 1)];
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
