import {
	DOUBLE_JUMP_VELOCITY,
	FALL_GRAVITY,
	GRAVITY,
	GROUND_Y,
	JUMP_CUT_MULTIPLIER,
	JUMP_VELOCITY,
	MAX_FALL_VELOCITY,
	MAX_JUMPS,
	PLAYER_START_X,
} from "@fangdash/shared";
// biome-ignore lint/performance/noNamespaceImport: Phaser requires namespace import
import * as Phaser from "phaser";

export class Player {
	sprite: Phaser.GameObjects.Sprite;
	private velocityY = 0;
	private jumpsRemaining = MAX_JUMPS;
	private _alive = true;
	private _grounded = true;
	private _boundsRect = new Phaser.Geom.Rectangle(0, 0, 0, 0);

	// Runtime-overridable constants (for debug menu)
	overrides: {
		gravity?: number;
		fallGravity?: number;
		jumpVelocity?: number;
		doubleJumpVelocity?: number;
		maxFallVelocity?: number;
		maxJumps?: number;
		groundY?: number;
	} = {};

	// Difficulty-driven gravity scaling
	gravityMultiplier = 1.0;

	constructor(scene: Phaser.Scene, skinKey = "wolf-gray") {
		this.sprite = scene.add.sprite(PLAYER_START_X, GROUND_Y, skinKey);
		this.sprite.setOrigin(0.5, 1);
		this.sprite.setScale(3);
		this.sprite.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
	}

	get alive() {
		return this._alive;
	}

	get grounded() {
		return this._grounded;
	}

	get currentVelocityY() {
		return this.velocityY;
	}

	get currentJumpsRemaining() {
		return this.jumpsRemaining;
	}

	get y() {
		return this.sprite.y;
	}

	get bounds(): Phaser.Geom.Rectangle {
		const insetX = 12 * this.sprite.scaleX;
		const insetYTop = 14 * this.sprite.scaleY; // more forgiving at top (head/ears)
		const insetYBot = 12 * this.sprite.scaleY; // pull up above transparent rows
		this._boundsRect.setTo(
			this.sprite.x - this.sprite.displayWidth / 2 + insetX,
			this.sprite.y - this.sprite.displayHeight + insetYTop,
			this.sprite.displayWidth - insetX * 2,
			this.sprite.displayHeight - insetYTop - insetYBot,
		);
		return this._boundsRect;
	}

	cutJump() {
		if (this.velocityY < 0) {
			this.velocityY *= JUMP_CUT_MULTIPLIER;
		}
	}

	jump() {
		const maxJumps = this.overrides.maxJumps ?? MAX_JUMPS;
		if (!this._alive || this.jumpsRemaining <= 0) {
			return;
		}

		this.jumpsRemaining--;
		this.velocityY =
			this.jumpsRemaining === maxJumps - 1
				? (this.overrides.jumpVelocity ?? JUMP_VELOCITY)
				: (this.overrides.doubleJumpVelocity ?? DOUBLE_JUMP_VELOCITY);
		this._grounded = false;
	}

	update(delta: number) {
		if (!this._alive) {
			return;
		}

		const dt = delta / 1000;
		const riseGravity =
			(this.overrides.gravity ?? GRAVITY) * this.gravityMultiplier;
		const fallGravity =
			(this.overrides.fallGravity ?? FALL_GRAVITY) * this.gravityMultiplier;
		const maxFallVelocity = this.overrides.maxFallVelocity ?? MAX_FALL_VELOCITY;
		const groundY = this.overrides.groundY ?? GROUND_Y;
		const maxJumps = this.overrides.maxJumps ?? MAX_JUMPS;

		// Asymmetric gravity: heavier when falling
		const gravity = this.velocityY >= 0 ? fallGravity : riseGravity;
		this.velocityY += gravity * dt;

		// Terminal velocity clamp
		if (this.velocityY > maxFallVelocity) {
			this.velocityY = maxFallVelocity;
		}

		this.sprite.y += this.velocityY * dt;

		// Ground check
		if (this.sprite.y >= groundY) {
			this.sprite.y = groundY;
			this.velocityY = 0;
			this.jumpsRemaining = maxJumps;
			this._grounded = true;
		} else {
			this._grounded = false;
		}

		// Slight bob when grounded
		if (this._grounded) {
			this.sprite.y = groundY + Math.sin(Date.now() / 200) * 1;
		}
	}

	die() {
		this._alive = false;
		this.sprite.setTint(0xff0000);
	}

	reset() {
		this._alive = true;
		this.velocityY = 0;
		this.jumpsRemaining = this.overrides.maxJumps ?? MAX_JUMPS;
		this.sprite.y = this.overrides.groundY ?? GROUND_Y;
		this.sprite.clearTint();
	}

	setSkin(key: string) {
		this.sprite.setTexture(key);
		this.sprite.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
	}
}
