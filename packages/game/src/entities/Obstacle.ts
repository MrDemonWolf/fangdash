import {
	GAME_WIDTH,
	GROUND_VISUAL_Y,
	OBSTACLE_EMBED_RATIO,
	OBSTACLE_TYPES,
	type ObstacleType,
	SeededRandom,
} from "@fangdash/shared";
// biome-ignore lint/performance/noNamespaceImport: Phaser requires namespace import
import * as Phaser from "phaser";

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
		this.sprite.setDepth(1);
		this.applyNearestFilter();
		this.sprite.setVisible(false);
	}

	get bounds(): Phaser.Geom.Rectangle {
		const inset = 4 * OBSTACLE_SCALE; // tighter inset: 8px per side at 2x scale
		const w = this.sprite.displayWidth;
		const h = this.sprite.displayHeight;
		const visibleH = h * (1 - OBSTACLE_EMBED_RATIO);
		this._boundsRect.setTo(
			this.sprite.x - w / 2 + inset,
			this.sprite.y - h + inset,
			w - inset * 2,
			visibleH - inset * 2,
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
		// Push bottom half of sprite below GROUND_VISUAL_Y so the ground tile clips it
		this.sprite.y =
			GROUND_VISUAL_Y + this.sprite.displayHeight * OBSTACLE_EMBED_RATIO;
	}

	update(speed: number, delta: number) {
		if (!this.active) {
			return;
		}

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
	private rng: SeededRandom | null = null;
	private timeSinceLastSpawn = 0;
	private nextSpawnTime = 1500;
	private allowedTypes: readonly ObstacleType[] = OBSTACLE_TYPES;
	obstaclesCleared = 0;

	constructor(scene: Phaser.Scene, poolSize = 10, seed?: string) {
		if (seed) {
			this.rng = new SeededRandom(seed);
		}
		for (let i = 0; i < poolSize; i++) {
			// biome-ignore lint/style/noNonNullAssertion: array index always valid
			const type = OBSTACLE_TYPES[i % OBSTACLE_TYPES.length]!;
			this.pool.push(new Obstacle(scene, type));
		}
	}

	setAllowedTypes(types: readonly ObstacleType[]) {
		this.allowedTypes = types;
	}

	update(
		speed: number,
		delta: number,
		minGap: number,
		maxGap: number,
		maxOnScreen?: number,
	) {
		this.timeSinceLastSpawn += delta;

		const atCap =
			maxOnScreen !== undefined && this.activeObstacleCount >= maxOnScreen;

		if (!atCap && this.timeSinceLastSpawn >= this.nextSpawnTime) {
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
		if (!inactive) {
			return;
		}

		const types = this.allowedTypes;
		if (types.length === 0) {
			return;
		}
		const type = this.rng
			? this.rng.pick(types)
			: // biome-ignore lint/style/noNonNullAssertion: array index always valid
				types[Phaser.Math.Between(0, types.length - 1)]!;
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
