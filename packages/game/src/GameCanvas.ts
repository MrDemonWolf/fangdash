import * as Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "@fangdash/shared";
import type { GameState, DebugState, DebugCommand } from "@fangdash/shared";
import { BootScene } from "./scenes/BootScene";
import { GameScene, type GameEventCallback } from "./scenes/GameScene";
import {
  RaceScene,
  type RaceCallbacks,
  type RaceOpponent,
} from "./scenes/RaceScene";

export interface DebugChannel {
  sendCommand: (command: DebugCommand) => void;
}

export interface GameChannel {
  start: () => void;
  preview: () => void;
  pause: () => void;
  resume: () => void;
}

export interface GameCanvasOptions {
  parent: HTMLElement;
  skinKey?: string;
  startDifficulty?: string;
  onStateUpdate?: (state: GameState) => void;
  onGameOver?: (state: GameState) => void;
  onDebugUpdate?: (state: DebugState) => void;
}

export interface AudioChannel {
  setVolume: (v: number) => void;
  getVolume: () => number;
  setMuted: (m: boolean) => void;
  getMuted: () => boolean;
}

export interface GameCanvasResult {
  game: Phaser.Game;
  debug: DebugChannel;
  audio: AudioChannel;
  gameChannel: GameChannel;
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
  onDebugUpdate?: (state: DebugState) => void;
}

export interface RaceCanvasResult {
  game: Phaser.Game;
  debug: DebugChannel;
  audio: AudioChannel;
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
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    input: {
      keyboard: true,
      touch: true,
    },
  };
}

export function createGame(options: GameCanvasOptions): GameCanvasResult {
  const callbacks: GameEventCallback = {
    onStateUpdate: options.onStateUpdate,
    onGameOver: options.onGameOver,
    onDebugUpdate: options.onDebugUpdate,
  };

  const game = new Phaser.Game(
    createPhaserConfig(options.parent, [BootScene, GameScene])
  );

  // Pass callbacks to GameScene when it starts
  game.events.on("ready", () => {
    const gameScene = game.scene.getScene("GameScene") as GameScene;
    if (gameScene) {
      gameScene.scene.restart({ callbacks, skinKey: options.skinKey, startDifficulty: options.startDifficulty });
    }
  });

  const debug: DebugChannel = {
    sendCommand: (command: DebugCommand) => {
      const gameScene = game.scene.getScene("GameScene") as GameScene;
      if (gameScene) {
        gameScene.sendDebugCommand(command);
      }
    },
  };

  const audio: AudioChannel = {
    setVolume: (v: number) => {
      const gameScene = game.scene.getScene("GameScene") as GameScene;
      gameScene?.audioManager?.setVolume(v);
    },
    getVolume: () => {
      const gameScene = game.scene.getScene("GameScene") as GameScene;
      if (gameScene?.audioManager) return gameScene.audioManager.volume;
      // Fallback: read from localStorage before scene is ready
      try {
        const stored = localStorage.getItem("fangdash_volume");
        if (stored !== null) { const v = parseFloat(stored); if (!isNaN(v)) return v; }
      } catch { /* ignore */ }
      return 0.5;
    },
    setMuted: (m: boolean) => {
      const gameScene = game.scene.getScene("GameScene") as GameScene;
      gameScene?.audioManager?.setMuted(m);
    },
    getMuted: () => {
      const gameScene = game.scene.getScene("GameScene") as GameScene;
      if (gameScene?.audioManager) return gameScene.audioManager.muted;
      // Fallback: read from localStorage before scene is ready
      try { return localStorage.getItem("fangdash_muted") === "true"; } catch { return false; }
    },
  };

  const gameChannel: GameChannel = {
    start: () => {
      const gameScene = game.scene.getScene("GameScene") as GameScene;
      if (gameScene) {
        gameScene.beginRun();
      }
    },
    preview: () => {
      const gameScene = game.scene.getScene("GameScene") as GameScene;
      gameScene?.beginPreview();
    },
    pause: () => {
      const gameScene = game.scene.getScene("GameScene") as GameScene;
      gameScene?.pause();
    },
    resume: () => {
      const gameScene = game.scene.getScene("GameScene") as GameScene;
      gameScene?.resume();
    },
  };

  return { game, debug, audio, gameChannel };
}

export function createRaceGame(options: RaceCanvasOptions): RaceCanvasResult {
  const callbacks: RaceCallbacks = {
    onStateUpdate: options.onStateUpdate,
    onGameOver: options.onGameOver,
    onPositionUpdate: options.onPositionUpdate,
    onPlayerDied: options.onPlayerDied,
    onDebugUpdate: options.onDebugUpdate,
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

  const debug: DebugChannel = {
    sendCommand: (command: DebugCommand) => {
      const raceScene = game.scene.getScene("RaceScene") as GameScene;
      if (raceScene) {
        raceScene.sendDebugCommand(command);
      }
    },
  };

  const audio: AudioChannel = {
    setVolume: (v: number) => {
      const raceScene = game.scene.getScene("RaceScene") as GameScene;
      raceScene?.audioManager?.setVolume(v);
    },
    getVolume: () => {
      const raceScene = game.scene.getScene("RaceScene") as GameScene;
      if (raceScene?.audioManager) return raceScene.audioManager.volume;
      try {
        const stored = localStorage.getItem("fangdash_volume");
        if (stored !== null) { const v = parseFloat(stored); if (!isNaN(v)) return v; }
      } catch { /* ignore */ }
      return 0.5;
    },
    setMuted: (m: boolean) => {
      const raceScene = game.scene.getScene("RaceScene") as GameScene;
      raceScene?.audioManager?.setMuted(m);
    },
    getMuted: () => {
      const raceScene = game.scene.getScene("RaceScene") as GameScene;
      if (raceScene?.audioManager) return raceScene.audioManager.muted;
      try { return localStorage.getItem("fangdash_muted") === "true"; } catch { return false; }
    },
  };

  return { game, debug, audio };
}

export function destroyGame(game: Phaser.Game) {
  game.destroy(true);
}
