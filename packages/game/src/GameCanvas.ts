import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "@fangdash/shared";
import type { GameState } from "@fangdash/shared";
import { BootScene } from "./scenes/BootScene";
import { GameScene, type GameEventCallback } from "./scenes/GameScene";

export interface GameCanvasOptions {
  parent: HTMLElement;
  skinKey?: string;
  onStateUpdate?: (state: GameState) => void;
  onGameOver?: (state: GameState) => void;
}

export function createGame(options: GameCanvasOptions): Phaser.Game {
  const callbacks: GameEventCallback = {
    onStateUpdate: options.onStateUpdate,
    onGameOver: options.onGameOver,
  };

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: options.parent,
    backgroundColor: "#0f0f1a",
    scene: [BootScene, GameScene],
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    input: {
      keyboard: true,
      touch: true,
    },
  });

  // Pass callbacks to GameScene when it starts
  game.events.on("ready", () => {
    const gameScene = game.scene.getScene("GameScene") as GameScene;
    if (gameScene) {
      gameScene.scene.restart({ callbacks, skinKey: options.skinKey });
    }
  });

  return game;
}

export function destroyGame(game: Phaser.Game) {
  game.destroy(true);
}
