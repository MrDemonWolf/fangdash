import Phaser from "phaser";
import { GAME_WIDTH, GROUND_Y } from "@fangdash/shared";
import type { GameState } from "@fangdash/shared";
import { Player } from "../entities/Player";
import { ObstacleSpawner } from "../entities/Obstacle";
import { ParallaxBackground } from "../systems/ParallaxBackground";
import { DifficultyScaler } from "../systems/DifficultyScaler";
import { ScoreManager } from "../systems/ScoreManager";

export type GameEventCallback = {
  onStateUpdate?: (state: GameState) => void;
  onGameOver?: (state: GameState) => void;
};

export class GameScene extends Phaser.Scene {
  protected player!: Player;
  protected spawner!: ObstacleSpawner;
  protected background!: ParallaxBackground;
  protected difficulty!: DifficultyScaler;
  protected scoreManager!: ScoreManager;
  protected ground!: Phaser.GameObjects.TileSprite;
  protected jumpKey!: Phaser.Input.Keyboard.Key;
  protected callbacks: GameEventCallback = {};
  protected running = false;

  constructor(key = "GameScene") {
    super({ key });
  }

  init(data: { callbacks?: GameEventCallback; skinKey?: string }) {
    this.callbacks = data.callbacks ?? {};
  }

  create() {
    // Background
    this.background = new ParallaxBackground(this);

    // Ground
    this.ground = this.add.tileSprite(0, GROUND_Y, GAME_WIDTH * 2, 16, "ground");
    this.ground.setOrigin(0, 0);
    this.ground.setDepth(0);

    // Player
    this.player = new Player(this);

    // Obstacles
    this.spawner = new ObstacleSpawner(this);

    // Systems
    this.difficulty = new DifficultyScaler();
    this.scoreManager = new ScoreManager();

    // Input
    if (this.input.keyboard) {
      this.jumpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

      this.input.keyboard.on("keydown-SPACE", () => {
        if (!this.running) {
          this.startRun();
        } else {
          this.player.jump();
        }
      });
    }

    // Touch / click input
    this.input.on("pointerdown", () => {
      if (!this.running) {
        this.startRun();
      } else {
        this.player.jump();
      }
    });

    this.running = false;
  }

  update(_time: number, delta: number) {
    if (!this.running || !this.player.alive) return;

    const speed = this.difficulty.currentSpeed;

    // Update systems
    this.difficulty.update(delta);
    this.player.update(delta);
    this.spawner.update(speed, delta, this.difficulty.minGap, this.difficulty.maxGap);
    this.background.update(speed, delta);
    this.scoreManager.update(delta, speed, this.spawner.obstaclesCleared);

    // Scroll ground
    this.ground.tilePositionX += speed * (delta / 1000);

    // Collision detection
    const playerBounds = this.player.bounds;
    for (const obstacle of this.spawner.getActiveObstacles()) {
      if (Phaser.Geom.Rectangle.Overlaps(playerBounds, obstacle.bounds)) {
        this.gameOver();
        return;
      }
    }

    // Emit state
    const state = this.scoreManager.getState(true, speed);
    this.callbacks.onStateUpdate?.(state);
  }

  protected startRun() {
    this.running = true;
    this.player.reset();
    this.spawner.reset();
    this.difficulty.reset();
    this.scoreManager.reset();
    this.background.reset();
  }

  protected gameOver() {
    this.running = false;
    this.player.die();

    const finalState = this.scoreManager.getState(false, this.difficulty.currentSpeed);
    this.callbacks.onGameOver?.(finalState);
  }

  restart() {
    this.startRun();
  }
}
