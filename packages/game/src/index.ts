export {
  createGame,
  createRaceGame,
  destroyGame,
  type GameCanvasOptions,
  type RaceCanvasOptions,
} from "./GameCanvas";
export { BootScene } from "./scenes/BootScene";
export { GameScene, type GameEventCallback } from "./scenes/GameScene";
export {
  RaceScene,
  type RaceCallbacks,
  type RaceOpponent,
  type RaceInitData,
} from "./scenes/RaceScene";
export { Player } from "./entities/Player";
export { GhostPlayer } from "./entities/GhostPlayer";
export { Obstacle, ObstacleSpawner } from "./entities/Obstacle";
export { ParallaxBackground } from "./systems/ParallaxBackground";
export { DifficultyScaler } from "./systems/DifficultyScaler";
export { ScoreManager } from "./systems/ScoreManager";
