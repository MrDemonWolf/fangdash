import Phaser from "phaser";
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  GROUND_Y,
  OBSTACLE_TYPES,
} from "@fangdash/shared";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload() {
    // Progress bar
    const barW = GAME_WIDTH * 0.6;
    const barH = 20;
    const barX = (GAME_WIDTH - barW) / 2;
    const barY = GAME_HEIGHT / 2;

    const bg = this.add.rectangle(barX + barW / 2, barY, barW, barH, 0x333333);
    const fill = this.add.rectangle(barX + 2, barY, 0, barH - 4, 0xff6b2b);
    fill.setOrigin(0, 0.5);

    this.load.on("progress", (value: number) => {
      fill.width = (barW - 4) * value;
    });

    this.load.on("complete", () => {
      bg.destroy();
      fill.destroy();
    });

    // Generate placeholder assets programmatically
    this.generatePlaceholderAssets();
  }

  create() {
    this.scene.start("GameScene");
  }

  private generatePlaceholderAssets() {
    // Wolf sprite (32x32 rectangle)
    const wolfGfx = this.add.graphics();
    wolfGfx.fillStyle(0x888888);
    wolfGfx.fillRect(0, 0, 40, 40);
    wolfGfx.fillStyle(0xff6b2b);
    wolfGfx.fillTriangle(32, 8, 40, 0, 40, 16); // ear
    wolfGfx.fillStyle(0xffffff);
    wolfGfx.fillCircle(30, 14, 3); // eye
    wolfGfx.generateTexture("wolf-gray", 40, 40);
    wolfGfx.destroy();

    // Ground
    const groundGfx = this.add.graphics();
    groundGfx.fillStyle(0x3d2b1f);
    groundGfx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);
    groundGfx.fillStyle(0x4a7c3f);
    groundGfx.fillRect(0, 0, GAME_WIDTH, 4);
    groundGfx.generateTexture("ground", GAME_WIDTH, GAME_HEIGHT - GROUND_Y);
    groundGfx.destroy();

    // Obstacles
    const obstacleConfigs: Record<string, { w: number; h: number; color: number }> = {
      rock: { w: 30, h: 30, color: 0x666666 },
      log: { w: 50, h: 25, color: 0x8b4513 },
      bush: { w: 35, h: 28, color: 0x2d5a27 },
      spike: { w: 20, h: 40, color: 0xcc3333 },
    };

    for (const type of OBSTACLE_TYPES) {
      const cfg = obstacleConfigs[type];
      const gfx = this.add.graphics();
      gfx.fillStyle(cfg.color);
      if (type === "spike") {
        gfx.fillTriangle(cfg.w / 2, 0, 0, cfg.h, cfg.w, cfg.h);
      } else {
        gfx.fillRoundedRect(0, 0, cfg.w, cfg.h, 4);
      }
      gfx.generateTexture(`obstacle-${type}`, cfg.w, cfg.h);
      gfx.destroy();
    }

    // Background layers
    const skyGfx = this.add.graphics();
    skyGfx.fillGradientStyle(0x0f0f1a, 0x0f0f1a, 0x1a1a3e, 0x1a1a3e);
    skyGfx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    skyGfx.generateTexture("bg-sky", GAME_WIDTH, GAME_HEIGHT);
    skyGfx.destroy();

    const hillsGfx = this.add.graphics();
    hillsGfx.fillStyle(0x1a2a1a);
    for (let i = 0; i < 6; i++) {
      const x = i * (GAME_WIDTH / 3);
      hillsGfx.fillEllipse(x, GAME_HEIGHT, GAME_WIDTH / 2.5, 200);
    }
    hillsGfx.generateTexture("bg-hills", GAME_WIDTH * 2, GAME_HEIGHT);
    hillsGfx.destroy();

    const treesGfx = this.add.graphics();
    treesGfx.fillStyle(0x0d1f0d);
    for (let i = 0; i < 12; i++) {
      const x = i * 80 + Math.random() * 40;
      const h = 60 + Math.random() * 40;
      treesGfx.fillTriangle(x, GROUND_Y - h, x - 20, GROUND_Y, x + 20, GROUND_Y);
    }
    treesGfx.generateTexture("bg-trees", GAME_WIDTH * 2, GAME_HEIGHT);
    treesGfx.destroy();
  }
}
