// biome-ignore lint/performance/noBarrelFile: package entry point
export { GhostPlayer } from "./entities/GhostPlayer.ts";
export { Obstacle, ObstacleSpawner } from "./entities/Obstacle.ts";
export { Player } from "./entities/Player.ts";
export {
	type AudioChannel,
	createGame,
	createRaceGame,
	type DebugChannel,
	destroyGame,
	type GameCanvasOptions,
	type GameCanvasResult,
	type GameChannel,
	type RaceCanvasOptions,
	type RaceCanvasResult,
} from "./GameCanvas.ts";
export { BootScene } from "./scenes/BootScene.ts";
export { type GameEventCallback, GameScene } from "./scenes/GameScene.ts";
export {
	type RaceCallbacks,
	type RaceInitData,
	type RaceOpponent,
	RaceScene,
} from "./scenes/RaceScene.ts";
export { AudioManager } from "./systems/AudioManager.ts";
export { DifficultyScaler } from "./systems/DifficultyScaler.ts";
export { ParallaxBackground } from "./systems/ParallaxBackground.ts";
export { ScoreManager } from "./systems/ScoreManager.ts";
