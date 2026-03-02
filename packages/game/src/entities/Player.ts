import Phaser from "phaser";
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

  constructor(scene: Phaser.Scene, skinKey = "wolf-gray") {
    this.scene = scene;
    this.sprite = scene.add.sprite(PLAYER_START_X, GROUND_Y - 20, skinKey);
    this.sprite.setOrigin(0.5, 1);
  }

  get alive() {
    return this._alive;
  }

  get grounded() {
    return this._grounded;
  }

  get y() {
    return this.sprite.y;
  }

  get bounds(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      this.sprite.x - this.sprite.width / 2 + 4,
      this.sprite.y - this.sprite.height + 4,
      this.sprite.width - 8,
      this.sprite.height - 8
    );
  }

  jump() {
    if (!this._alive || this.jumpsRemaining <= 0) return;

    this.jumpsRemaining--;
    this.velocityY = this.jumpsRemaining === MAX_JUMPS - 1
      ? JUMP_VELOCITY
      : DOUBLE_JUMP_VELOCITY;
    this._grounded = false;
  }

  update(delta: number) {
    if (!this._alive) return;

    const dt = delta / 1000;

    this.velocityY += GRAVITY * dt;
    this.sprite.y += this.velocityY * dt;

    // Ground check
    if (this.sprite.y >= GROUND_Y) {
      this.sprite.y = GROUND_Y;
      this.velocityY = 0;
      this.jumpsRemaining = MAX_JUMPS;
      this._grounded = true;
    } else {
      this._grounded = false;
    }

    // Slight bob when grounded
    if (this._grounded) {
      this.sprite.y = GROUND_Y + Math.sin(Date.now() / 200) * 1;
    }
  }

  die() {
    this._alive = false;
    this.sprite.setTint(0xff0000);
  }

  reset() {
    this._alive = true;
    this.velocityY = 0;
    this.jumpsRemaining = MAX_JUMPS;
    this.sprite.y = GROUND_Y;
    this.sprite.clearTint();
  }

  setSkin(key: string) {
    this.sprite.setTexture(key);
  }
}
