// biome-ignore lint/style/useFilenamingConvention: established class name
import type { DebugCommand, DebugState, GameState } from "@fangdash/shared";
import { GAME_HEIGHT, GAME_WIDTH } from "@fangdash/shared";
// biome-ignore lint/performance/noNamespaceImport: Phaser requires namespace import
import * as Phaser from "phaser";
import { BootScene } from "./scenes/BootScene.ts";
import { type GameEventCallback, GameScene } from "./scenes/GameScene.ts";
import {
	type RaceCallbacks,
	type RaceOpponent,
	RaceScene,
} from "./scenes/RaceScene.ts";

export interface DebugChannel {
	sendCommand: (command: DebugCommand) => void;
}

export interface GameChannel {
	start: (difficulty?: string) => void;
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
	onError?: (message: string) => void;
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
	onError?: (message: string) => void;
}

export interface RaceCanvasResult {
	game: Phaser.Game;
	debug: DebugChannel;
	audio: AudioChannel;
}

function createPhaserConfig(
	parent: HTMLElement,
	scenes: Phaser.Types.Scenes.SceneType[],
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
			width: GAME_WIDTH,
			height: GAME_HEIGHT,
		},
		input: {
			keyboard: true,
			touch: true,
		},
	};
}

export function createGame(options: GameCanvasOptions): GameCanvasResult {
	const callbacks = {
		onStateUpdate: options.onStateUpdate,
		onGameOver: options.onGameOver,
		onDebugUpdate: options.onDebugUpdate,
	} satisfies GameEventCallback;

	const game = new Phaser.Game(
		createPhaserConfig(options.parent, [BootScene, GameScene]),
	);

	// Surface critical asset load failures to the React layer
	if (options.onError) {
		game.events.on("boot-error", ({ message }: { key: string; message: string }) => {
			options.onError!(message);
		});
	}

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
			if (gameScene?.audioManager) {
				return gameScene.audioManager.volume;
			}
			// Fallback: read from localStorage before scene is ready
			try {
				const stored = localStorage.getItem("fangdash_volume");
				if (stored !== null) {
					const v = Number.parseFloat(stored);
					if (!Number.isNaN(v)) {
						return v;
					}
				}
			} catch {
				/* ignore */
			}
			return 0.5;
		},
		setMuted: (m: boolean) => {
			const gameScene = game.scene.getScene("GameScene") as GameScene;
			gameScene?.audioManager?.setMuted(m);
		},
		getMuted: () => {
			const gameScene = game.scene.getScene("GameScene") as GameScene;
			if (gameScene?.audioManager) {
				return gameScene.audioManager.muted;
			}
			// Fallback: read from localStorage before scene is ready
			try {
				return localStorage.getItem("fangdash_muted") === "true";
			} catch {
				return false;
			}
		},
	};

	const gameChannel: GameChannel = {
		start: (difficulty?: string) => {
			const gameScene = game.scene.getScene("GameScene") as GameScene;
			if (gameScene) {
				if (difficulty) {
					gameScene.setStartDifficulty(difficulty);
				}
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
	const callbacks = {
		onStateUpdate: options.onStateUpdate,
		onGameOver: options.onGameOver,
		onPositionUpdate: options.onPositionUpdate,
		onPlayerDied: options.onPlayerDied,
		onDebugUpdate: options.onDebugUpdate,
	} satisfies RaceCallbacks;

	const game = new Phaser.Game(
		createPhaserConfig(options.parent, [BootScene, RaceScene]),
	);

	// Surface critical asset load failures to the React layer
	if (options.onError) {
		game.events.on("boot-error", ({ message }: { key: string; message: string }) => {
			options.onError!(message);
		});
	}

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
			if (raceScene?.audioManager) {
				return raceScene.audioManager.volume;
			}
			try {
				const stored = localStorage.getItem("fangdash_volume");
				if (stored !== null) {
					const v = Number.parseFloat(stored);
					if (!Number.isNaN(v)) {
						return v;
					}
				}
			} catch {
				/* ignore */
			}
			return 0.5;
		},
		setMuted: (m: boolean) => {
			const raceScene = game.scene.getScene("RaceScene") as GameScene;
			raceScene?.audioManager?.setMuted(m);
		},
		getMuted: () => {
			const raceScene = game.scene.getScene("RaceScene") as GameScene;
			if (raceScene?.audioManager) {
				return raceScene.audioManager.muted;
			}
			try {
				return localStorage.getItem("fangdash_muted") === "true";
			} catch {
				return false;
			}
		},
	};

	return { game, debug, audio };
}

export function destroyGame(game: Phaser.Game) {
	game.destroy(true);
}
