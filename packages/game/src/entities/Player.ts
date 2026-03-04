import * as Phaser from "phaser";
import {
  GRAVITY,
  JUMP_VELOCITY,
  DOUBLE_JUMP_VELOCITY,
  MAX_JUMPS,
  GROUND_Y,
  PLAYER_START_X,
} from "@fangdash/shared";

export class Player {
  sprite: Phaser.GameObjects.Sprite;
  private scene: Phaser.Scene;
  private velocityY = 0;
  private jumpsRemaining = MAX_JUMPS;
  private _alive = true;
  private _grounded = true;
  private _boundsRect = new Phaser.Geom.Rectangle(0, 0, 0, 0);

  // Runtime-overridable constants (for debug menu)
  overrides: {
    gravity?: number;
    jumpVelocity?: number;
    doubleJumpVelocity?: number;
    maxJumps?: number;
    groundY?: number;
  } = {};

  constructor(scene: Phaser.Scene, skinKey = "wolf-gray") {
    this.scene = scene;
    this.sprite = scene.add.sprite(PLAYER_START_X, GROUND_Y - 20, skinKey);
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
    const insetX = 4 * this.sprite.scaleX;
    const insetY = 4 * this.sprite.scaleY;
    this._boundsRect.setTo(
      this.sprite.x - this.sprite.displayWidth / 2 + insetX,
      this.sprite.y - this.sprite.displayHeight + insetY,
      this.sprite.displayWidth - insetX * 2,
      this.sprite.displayHeight - insetY * 2
    );
    return this._boundsRect;
  }

  jump() {
    const maxJumps = this.overrides.maxJumps ?? MAX_JUMPS;
    if (!this._alive || this.jumpsRemaining <= 0) return;

    this.jumpsRemaining--;
    this.velocityY = this.jumpsRemaining === maxJumps - 1
      ? (this.overrides.jumpVelocity ?? JUMP_VELOCITY)
      : (this.overrides.doubleJumpVelocity ?? DOUBLE_JUMP_VELOCITY);
    this._grounded = false;
  }

  update(delta: number) {
    if (!this._alive) return;

    const dt = delta / 1000;
    const gravity = this.overrides.gravity ?? GRAVITY;
    const groundY = this.overrides.groundY ?? GROUND_Y;
    const maxJumps = this.overrides.maxJumps ?? MAX_JUMPS;

    this.velocityY += gravity * dt;
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
