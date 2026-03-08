import * as Phaser from "phaser";
import { GAME_WIDTH, GROUND_Y, AUDIO_KEYS } from "@fangdash/shared";
import type { GameState, DebugState, DebugCommand } from "@fangdash/shared";
import { Player } from "../entities/Player";
import { ObstacleSpawner } from "../entities/Obstacle";
import { ParallaxBackground } from "../systems/ParallaxBackground";
import { DifficultyScaler } from "../systems/DifficultyScaler";
import { ScoreManager } from "../systems/ScoreManager";
import { AudioManager } from "../systems/AudioManager";

export type GameEventCallback = {
  onStateUpdate?: (state: GameState) => void;
  onGameOver?: (state: GameState) => void;
  onDebugUpdate?: (state: DebugState) => void;
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
  protected skinKey = "wolf-gray";
  protected seed?: string;
  protected running = false;
  private previewing = false;
  private startDifficulty?: string;
  audioManager!: AudioManager;

  // Debug state
  private debugInvincible = false;
  private debugHitboxes = false;
  private debugRenderBoxes = false;
  private debugGraphics: Phaser.GameObjects.Graphics | null = null;
  private debugElapsedMs = 0;
  private debugSpeedMultiplier = 1.0;

  constructor(key = "GameScene") {
    super({ key });
  }

  init(data: { callbacks?: GameEventCallback; skinKey?: string; seed?: string; startDifficulty?: string }) {
    this.callbacks = data.callbacks ?? {};
    this.skinKey = data.skinKey ?? "wolf-gray";
    this.seed = data.seed;
    this.startDifficulty = data.startDifficulty;
  }

  create() {
    // Background
    this.background = new ParallaxBackground(this);

    // Ground
    this.ground = this.add.tileSprite(0, GROUND_Y, GAME_WIDTH * 2, 16, "ground");
    this.ground.setOrigin(0, 0);
    this.ground.setDepth(0);

    // Player
    this.player = new Player(this, this.skinKey);

    // Obstacles
    this.spawner = new ObstacleSpawner(this, 10, this.seed);

    // Systems
    this.difficulty = new DifficultyScaler();
    this.scoreManager = new ScoreManager();
    this.audioManager = new AudioManager(this);

    // Clean up BGM on scene shutdown
    this.events.on("shutdown", () => {
      this.audioManager.stopBGM();
    });

    // Input
    if (this.input.keyboard) {
      this.jumpKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

      this.input.keyboard.on("keydown-SPACE", () => {
        if (this.running) {
          this.player.jump();
          this.audioManager.playSFX(AUDIO_KEYS.SFX_JUMP);
        }
      });
    }

    // Touch / click input
    this.input.on("pointerdown", () => {
      if (this.running) {
        this.player.jump();
        this.audioManager.playSFX(AUDIO_KEYS.SFX_JUMP);
      }
    });

    this.running = false;
    this.callbacks.onDebugUpdate?.(this.collectDebugState(0));
  }

  update(_time: number, delta: number) {
    if (this.previewing) {
      const speed = this.difficulty.currentSpeed;
      this.background.update(speed, delta);
      this.ground.tilePositionX += speed * (delta / 1000);
      return;
    }
    if (!this.running || !this.player.alive) return;

    // Apply speed multiplier for debug slow-mo / fast-forward
    const adjustedDelta = delta * this.debugSpeedMultiplier;

    const speed = this.difficulty.currentSpeed;

    // Track elapsed time for debug
    this.debugElapsedMs += adjustedDelta;

    // Update systems
    this.difficulty.update(adjustedDelta);
    this.player.update(adjustedDelta);
    this.spawner.update(speed, adjustedDelta, this.difficulty.minGap, this.difficulty.maxGap);
    this.background.update(speed, adjustedDelta);
    this.scoreManager.update(adjustedDelta, speed, this.spawner.obstaclesCleared);

    // Scroll ground
    this.ground.tilePositionX += speed * (adjustedDelta / 1000);

    // Collision detection (skip if invincible)
    if (!this.debugInvincible) {
      const playerBounds = this.player.bounds;
      for (const obstacle of this.spawner.getActiveObstacles()) {
        if (Phaser.Geom.Rectangle.Overlaps(playerBounds, obstacle.bounds)) {
          this.gameOver();
          return;
        }
      }
    }

    // Draw hitbox/render box visualizations
    if (this.debugHitboxes || this.debugRenderBoxes) {
      this.drawDebugHitboxes();
    }

    // Emit state
    const state = this.scoreManager.getState(true, speed);
    this.callbacks.onStateUpdate?.(state);

    // Emit debug state (only when callback is set)
    if (this.callbacks.onDebugUpdate) {
      this.callbacks.onDebugUpdate(this.collectDebugState(delta));
    }
  }

  protected startRun() {
    this.previewing = false;
    this.running = true;
    this.debugElapsedMs = 0;
    this.player.reset();
    this.spawner.reset();
    this.difficulty.reset();
    if (this.startDifficulty) {
      this.difficulty.setStartLevel(this.startDifficulty);
    }
    this.scoreManager.reset();
    this.background.reset();
    this.audioManager.playBGM(AUDIO_KEYS.BGM_GAME);
  }

  protected gameOver() {
    this.running = false;
    this.player.die();
    this.audioManager.stopBGM();
    this.audioManager.playSFX(AUDIO_KEYS.SFX_HIT);
    this.audioManager.playSFX(AUDIO_KEYS.SFX_GAME_OVER);

    const finalState = this.scoreManager.getState(false, this.difficulty.currentSpeed);
    this.callbacks.onGameOver?.(finalState);
  }

  public beginRun() {
    if (!this.running) {
      this.startRun();
    }
  }

  public beginPreview() {
    this.previewing = true;
  }

  public pause() {
    this.running = false;
  }

  public resume() {
    if (this.player.alive) this.running = true;
  }

  restart() {
    this.startRun();
  }

  // ── Debug Methods ──

  private collectDebugState(rawDelta: number): DebugState {
    const bounds = this.player.bounds;
    return {
      fps: Math.round(this.game.loop.actualFps),
      frameDelta: Math.round(rawDelta * 100) / 100,
      player: {
        x: Math.round(this.player.sprite.x),
        y: Math.round(this.player.y),
        velocityY: Math.round(this.player.currentVelocityY),
        jumpsRemaining: this.player.currentJumpsRemaining,
        grounded: this.player.grounded,
        alive: this.player.alive,
        bounds: {
          x: Math.round(bounds.x),
          y: Math.round(bounds.y),
          width: Math.round(bounds.width),
          height: Math.round(bounds.height),
        },
      },
      scoring: {
        score: Math.floor(this.scoreManager.score),
        distance: Math.floor(this.scoreManager.distance),
        obstaclesCleared: this.scoreManager.obstaclesCleared,
        currentSpeed: Math.round(this.difficulty.currentSpeed),
        elapsedMs: Math.round(this.debugElapsedMs),
      },
      difficulty: {
        levelName: this.difficulty.levelName,
        speedMultiplier: this.difficulty.speedMultiplier,
        spawnRateMultiplier: this.difficulty.spawnRateMultiplier,
        minGap: Math.round(this.difficulty.minGap),
        maxGap: Math.round(this.difficulty.maxGap),
      },
      spawner: {
        timeSinceLastSpawn: Math.round(this.spawner.currentTimeSinceLastSpawn),
        nextSpawnTime: Math.round(this.spawner.currentNextSpawnTime),
        activeObstacleCount: this.spawner.activeObstacleCount,
      },
      debug: {
        hitboxes: this.debugHitboxes,
        renderBoxes: this.debugRenderBoxes,
        invincible: this.debugInvincible,
        speedMultiplier: this.debugSpeedMultiplier,
      },
    };
  }

  private drawDebugHitboxes() {
    if (!this.debugGraphics) {
      this.debugGraphics = this.add.graphics();
      this.debugGraphics.setDepth(1000);
    }

    this.debugGraphics.clear();

    // Collision hitboxes
    if (this.debugHitboxes) {
      // Player hitbox — green
      const pb = this.player.bounds;
      this.debugGraphics.lineStyle(2, 0x00ff00, 0.8);
      this.debugGraphics.strokeRect(pb.x, pb.y, pb.width, pb.height);

      // Obstacle hitboxes — red
      this.debugGraphics.lineStyle(2, 0xff0000, 0.8);
      for (const obstacle of this.spawner.getActiveObstacles()) {
        const ob = obstacle.bounds;
        this.debugGraphics.strokeRect(ob.x, ob.y, ob.width, ob.height);
      }
    }

    // Render/sprite bounds
    if (this.debugRenderBoxes) {
      // Player sprite bounds — cyan
      const playerSprite = this.player.sprite;
      const pb = playerSprite.getBounds();
      this.debugGraphics.lineStyle(2, 0x0faced, 0.8);
      this.debugGraphics.strokeRect(pb.x, pb.y, pb.width, pb.height);

      // Obstacle sprite bounds — orange
      this.debugGraphics.lineStyle(2, 0xff6b2b, 0.8);
      for (const obstacle of this.spawner.getActiveObstacles()) {
        const ob = obstacle.sprite.getBounds();
        this.debugGraphics.strokeRect(ob.x, ob.y, ob.width, ob.height);
      }
    }
  }

  private clearDebugHitboxes() {
    if (this.debugGraphics) {
      this.debugGraphics.clear();
      this.debugGraphics.destroy();
      this.debugGraphics = null;
    }
  }

  sendDebugCommand(command: DebugCommand) {
    switch (command.type) {
      case "set-constant": {
        const { key, value } = command.payload as { key: string; value: number };
        this.applyConstantOverride(key, value);
        break;
      }

      case "toggle-hitboxes":
        this.debugHitboxes = !this.debugHitboxes;
        if (!this.debugHitboxes && !this.debugRenderBoxes) {
          this.clearDebugHitboxes();
        }
        break;

      case "toggle-render-boxes":
        this.debugRenderBoxes = !this.debugRenderBoxes;
        if (!this.debugRenderBoxes && !this.debugHitboxes) {
          this.clearDebugHitboxes();
        }
        break;

      case "toggle-invincibility":
        this.debugInvincible = !this.debugInvincible;
        break;

      case "set-difficulty": {
        const levelIndex = command.payload as number;
        this.difficulty.forceDifficulty(levelIndex);
        break;
      }

      case "force-game-over":
        if (this.running && this.player.alive) {
          this.gameOver();
        }
        break;

      case "set-speed-multiplier": {
        const multiplier = command.payload as number;
        this.debugSpeedMultiplier = Math.max(0.1, Math.min(3.0, multiplier));
        break;
      }

      case "reset-constants":
        this.debugInvincible = false;
        this.debugHitboxes = false;
        this.debugRenderBoxes = false;
        this.debugSpeedMultiplier = 1.0;
        this.difficulty.forceDifficulty(null);
        this.difficulty.overrides = {};
        this.player.overrides = {};
        this.scoreManager.overrides = {};
        this.clearDebugHitboxes();
        break;
    }
    this.callbacks.onDebugUpdate?.(this.collectDebugState(0));
  }

  private applyConstantOverride(key: string, value: number) {
    switch (key) {
      // Physics → Player
      case "GRAVITY": this.player.overrides.gravity = value; break;
      case "JUMP_VELOCITY": this.player.overrides.jumpVelocity = value; break;
      case "DOUBLE_JUMP_VELOCITY": this.player.overrides.doubleJumpVelocity = value; break;
      case "MAX_JUMPS": this.player.overrides.maxJumps = value; break;
      case "GROUND_Y": this.player.overrides.groundY = value; break;
      // Speed → DifficultyScaler
      case "BASE_SPEED": this.difficulty.overrides.baseSpeed = value; break;
      case "MAX_SPEED": this.difficulty.overrides.maxSpeed = value; break;
      case "SPEED_INCREMENT": this.difficulty.overrides.speedIncrement = value; break;
      case "SPEED_INCREASE_INTERVAL_MS": this.difficulty.overrides.speedIntervalMs = value; break;
      // Scoring → ScoreManager
      case "SCORE_PER_SECOND": this.scoreManager.overrides.scorePerSecond = value; break;
      case "SCORE_PER_OBSTACLE": this.scoreManager.overrides.scorePerObstacle = value; break;
      case "DISTANCE_MULTIPLIER": this.scoreManager.overrides.distanceMultiplier = value; break;
      // Obstacles → DifficultyScaler
      case "MIN_OBSTACLE_GAP_MS": this.difficulty.overrides.minGapMs = value; break;
      case "MAX_OBSTACLE_GAP_MS": this.difficulty.overrides.maxGapMs = value; break;
    }
  }
}
