import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "@fangdash/shared";
import type { GameState } from "@fangdash/shared";
import { BootScene } from "./scenes/BootScene";
import { GameScene, type GameEventCallback } from "./scenes/GameScene";
import {
  RaceScene,
  type RaceCallbacks,
  type RaceOpponent,
} from "./scenes/RaceScene";

export interface GameCanvasOptions {
  parent: HTMLElement;
  skinKey?: string;
  onStateUpdate?: (state: GameState) => void;
  onGameOver?: (state: GameState) => void;
}

export interface RaceCanvasOptions {
  parent: HTMLElement;
  skinKey?: string;
  seed: string;
  opponents: RaceOpponent[];
  onStateUpdate?: (state: GameState) => void;
  onGameOver?: (state: GameState) => void;
  onPositionUpdate?: (distance: number, score: number) => void;
  onPlayerDied?: () => void;
}

function createPhaserConfig(
  parent: HTMLElement,
  scenes: Phaser.Types.Scenes.SceneType[]
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent,
    backgroundColor: "#0f0f1a",
    scene: scenes,
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.ENVELOP,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    input: {
      keyboard: true,
      touch: true,
    },
  };
}

export function createGame(options: GameCanvasOptions): Phaser.Game {
  const callbacks: GameEventCallback = {
    onStateUpdate: options.onStateUpdate,
    onGameOver: options.onGameOver,
  };

  const game = new Phaser.Game(
    createPhaserConfig(options.parent, [BootScene, GameScene])
  );

  // Pass callbacks to GameScene when it starts
  game.events.on("ready", () => {
    const gameScene = game.scene.getScene("GameScene") as GameScene;
    if (gameScene) {
      gameScene.scene.restart({ callbacks, skinKey: options.skinKey });
    }
  });

  return game;
}

export function createRaceGame(options: RaceCanvasOptions): Phaser.Game {
  const callbacks: RaceCallbacks = {
    onStateUpdate: options.onStateUpdate,
    onGameOver: options.onGameOver,
    onPositionUpdate: options.onPositionUpdate,
    onPlayerDied: options.onPlayerDied,
  };

  const game = new Phaser.Game(
    createPhaserConfig(options.parent, [BootScene, RaceScene])
  );

  // Pass race data to RaceScene when it starts
  game.events.on("ready", () => {
    const raceScene = game.scene.getScene("RaceScene") as RaceScene;
    if (raceScene) {
      raceScene.scene.restart({
        callbacks,
        skinKey: options.skinKey,
        seed: options.seed,
        opponents: options.opponents,
      });
    }
  });

  return game;
}

export function destroyGame(game: Phaser.Game) {
  game.destroy(true);
}
