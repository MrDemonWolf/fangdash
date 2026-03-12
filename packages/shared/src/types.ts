// ── Roles ──
export type UserRole = "user" | "admin" | "dev";

// ── Player ──
export interface Player {
	id: string;
	twitchId: string | null;
	twitchAvatar: string | null;
	username: string;
	equippedSkinId: string;
	createdAt: string;
	updatedAt: string;
}

// ── Scores ──
export interface Score {
	id: string;
	playerId: string;
	score: number;
	distance: number;
	obstaclesCleared: number;
	seed: string;
	createdAt: string;
}

export interface LeaderboardEntry {
	rank: number;
	playerId: string;
	username: string;
	score: number;
	skinId: string;
}

// ── Skins ──
export type SkinRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface SkinDefinition {
	id: string;
	name: string;
	description: string;
	rarity: SkinRarity;
	spriteKey: string;
	unlockCondition: SkinUnlockCondition;
}

export type SkinUnlockCondition =
	| { type: "default" }
	| { type: "score"; threshold: number }
	| { type: "achievement"; achievementId: string }
	| { type: "games_played"; count: number }
	| { type: "distance"; threshold: number };

export interface PlayerSkin {
	playerId: string;
	skinId: string;
	unlockedAt: string;
}

// ── Achievements ──
export type AchievementCategory =
	| "score"
	| "distance"
	| "games"
	| "skill"
	| "social";

export interface AchievementDefinition {
	id: string;
	name: string;
	description: string;
	category: AchievementCategory;
	icon: string;
	condition: AchievementCondition;
	rewardSkinId?: string;
}

export type AchievementCondition =
	| { type: "score_single"; threshold: number }
	| { type: "score_total"; threshold: number }
	| { type: "distance_single"; threshold: number }
	| { type: "distance_total"; threshold: number }
	| { type: "games_played"; count: number }
	| { type: "obstacles_cleared"; count: number }
	| { type: "races_won"; count: number }
	| { type: "races_played"; count: number }
	| { type: "perfect_run"; distance: number };

export interface PlayerAchievement {
	playerId: string;
	achievementId: string;
	unlockedAt: string;
}

// ── Multiplayer / Racing ──
export type RaceStatus = "waiting" | "countdown" | "racing" | "finished";

export interface RaceRoom {
	id: string;
	status: RaceStatus;
	seed: string;
	players: RacePlayer[];
	hostId: string | null;
	startedAt?: string | undefined;
	finishedAt?: string | undefined;
}

export interface RacePlayer {
	id: string;
	username: string;
	skinId: string;
	distance: number;
	score: number;
	alive: boolean;
	ready: boolean;
	isHost: boolean;
	finishTime?: number | undefined;
}

export interface RaceResult {
	raceId: string;
	playerId: string;
	placement: number;
	score: number;
	distance: number;
}

// ── WebSocket Messages ──
export type ClientMessage =
	| { type: "join"; payload: { username: string; skinId: string } }
	| { type: "update"; payload: { distance: number; score: number } }
	| { type: "died" }
	| { type: "ready" }
	| { type: "kick"; payload: { playerId: string } }
	| { type: "rematch" };

export type ServerMessage =
	| { type: "room_state"; payload: RaceRoom }
	| { type: "player_joined"; payload: RacePlayer }
	| { type: "player_left"; payload: { id: string } }
	| {
			type: "player_update";
			payload: { id: string; distance: number; score: number };
	  }
	| { type: "player_died"; payload: { id: string } }
	| { type: "countdown"; payload: { seconds: number } }
	| { type: "race_start"; payload: { seed: string } }
	| { type: "race_end"; payload: { results: RaceResult[] } }
	| { type: "host_changed"; payload: { hostId: string } }
	| { type: "player_ready"; payload: { id: string; ready: boolean } }
	| { type: "player_kicked"; payload: { id: string } }
	| { type: "room_reset"; payload: RaceRoom };

// ── Game State ──
export interface GameState {
	score: number;
	distance: number;
	obstaclesCleared: number;
	alive: boolean;
	speed: number;
}

// ── Debug ──
export interface DebugState {
	fps: number;
	frameDelta: number;
	player: {
		x: number;
		y: number;
		velocityY: number;
		jumpsRemaining: number;
		grounded: boolean;
		alive: boolean;
		bounds: { x: number; y: number; width: number; height: number };
	};
	scoring: {
		score: number;
		distance: number;
		obstaclesCleared: number;
		currentSpeed: number;
		elapsedMs: number;
	};
	difficulty: {
		levelName: string;
		speedMultiplier: number;
		spawnRateMultiplier: number;
		minGap: number;
		maxGap: number;
		obstacleTypes: readonly string[];
		gravityMultiplier: number;
		maxObstaclesOnScreen: number;
	};
	spawner: {
		timeSinceLastSpawn: number;
		nextSpawnTime: number;
		activeObstacleCount: number;
	};
	debug: {
		hitboxes: boolean;
		renderBoxes: boolean;
		invincible: boolean;
		speedMultiplier: number;
	};
}

export interface DebugCommand {
	type:
		| "set-constant"
		| "toggle-hitboxes"
		| "toggle-render-boxes"
		| "toggle-invincibility"
		| "set-difficulty"
		| "force-game-over"
		| "set-speed-multiplier"
		| "reset-constants";
	payload?: unknown;
}
