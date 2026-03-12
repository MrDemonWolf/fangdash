// ── Physics ──
export const GRAVITY = 1600;
export const FALL_GRAVITY = 2000;
export const JUMP_VELOCITY = -750;
export const DOUBLE_JUMP_VELOCITY = -600;
export const MAX_FALL_VELOCITY = 900;
export const MAX_JUMPS = 2;
export const JUMP_CUT_MULTIPLIER = 0.4;
// Wolf sprite (48×48, 3× scale) has 13 transparent rows at the bottom = 39px visual offset.
// Grass tile top is at GAME_HEIGHT - GROUND_HEIGHT = 500. Visible feet land 8px into the grass (y=508).
// GROUND_Y = 508 + 39 = 547.
export const GROUND_Y = 547;

// ── Speed & Difficulty ──
export const BASE_SPEED = 300;
export const MAX_SPEED = 800;
export const SPEED_INCREMENT = 0.5;
export const SPEED_INCREASE_INTERVAL_MS = 1000;

// ── Scoring ──
export const SCORE_PER_SECOND = 10;
export const SCORE_PER_OBSTACLE = 50;
export const DISTANCE_MULTIPLIER = 0.1;

// ── Obstacles ──
export const OBSTACLE_GROUND_Y = 518; // grass top (500) + 18px embed so logs sit in grass
export const MIN_OBSTACLE_GAP_MS = 800;
export const MAX_OBSTACLE_GAP_MS = 2500;
export const OBSTACLE_TYPES = ["rock", "log", "bush", "spike"] as const;
export type ObstacleType = (typeof OBSTACLE_TYPES)[number];

// ── Viewport ──
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export const GROUND_HEIGHT = 100;
export const GROUND_VISUAL_Y = GAME_HEIGHT - GROUND_HEIGHT; // 500 — top edge of the dirt strip
export const PLAYER_START_X = 150;

// ── Obstacle embedding ──
export const OBSTACLE_EMBED_RATIO = 0.5; // fraction of obstacle height below GROUND_VISUAL_Y

// ── Multiplayer ──
export const MAX_PLAYERS_PER_RACE = 4;
export const RACE_COUNTDOWN_SECONDS = 3;
export const MIN_PLAYERS_TO_START = 2;

// ── Difficulty Scaling ──
export interface DifficultyLevel {
	name: string;
	startDistance: number;
	speedMultiplier: number;
	spawnRateMultiplier: number;
	obstacleTypes: readonly ObstacleType[];
	gravityMultiplier: number;
	maxObstaclesOnScreen: number;
}

export const DIFFICULTY_LEVELS: readonly DifficultyLevel[] = [
	{
		name: "easy",
		startDistance: 0,
		speedMultiplier: 1.0,
		spawnRateMultiplier: 1.0,
		obstacleTypes: ["rock", "log", "bush"],
		gravityMultiplier: 1.0,
		maxObstaclesOnScreen: 2,
	},
	{
		name: "medium",
		startDistance: 500,
		speedMultiplier: 1.3,
		spawnRateMultiplier: 1.2,
		obstacleTypes: ["rock", "log", "bush", "spike"],
		gravityMultiplier: 1.0,
		maxObstaclesOnScreen: 3,
	},
	{
		name: "hard",
		startDistance: 1500,
		speedMultiplier: 1.6,
		spawnRateMultiplier: 1.5,
		obstacleTypes: ["rock", "log", "bush", "spike"],
		gravityMultiplier: 1.1,
		maxObstaclesOnScreen: 3,
	},
	{
		name: "insane",
		startDistance: 3000,
		speedMultiplier: 2.0,
		spawnRateMultiplier: 1.8,
		obstacleTypes: ["rock", "bush", "spike"],
		gravityMultiplier: 1.15,
		maxObstaclesOnScreen: 4,
	},
	{
		name: "nightmare",
		startDistance: 5000,
		speedMultiplier: 2.5,
		spawnRateMultiplier: 2.2,
		obstacleTypes: ["bush", "spike"],
		gravityMultiplier: 1.2,
		maxObstaclesOnScreen: 5,
	},
];

// ── Audio ──
export const AUDIO_KEYS = {
	BGM_MENU: "bgm-menu",
	BGM_GAME: "bgm-game",
	BGM_RACE: "bgm-race",
	SFX_JUMP: "sfx-jump",
	SFX_DOUBLE_JUMP: "sfx-double-jump",
	SFX_HIT: "sfx-hit",
	SFX_GAME_OVER: "sfx-game-over",
	SFX_MILESTONE: "sfx-milestone",
	SFX_COUNTDOWN: "sfx-countdown",
	SFX_ACHIEVEMENT: "sfx-achievement",
	SFX_SKIN_EQUIP: "sfx-skin-equip",
	SFX_VICTORY: "sfx-victory",
} as const;
