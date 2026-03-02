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
export type AchievementCategory = "score" | "distance" | "games" | "skill" | "social";

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
  startedAt?: string;
  finishedAt?: string;
}

export interface RacePlayer {
  id: string;
  username: string;
  skinId: string;
  distance: number;
  score: number;
  alive: boolean;
  finishTime?: number;
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
  | { type: "ready" };

export type ServerMessage =
  | { type: "room_state"; payload: RaceRoom }
  | { type: "player_joined"; payload: RacePlayer }
  | { type: "player_left"; payload: { id: string } }
  | { type: "player_update"; payload: { id: string; distance: number; score: number } }
  | { type: "player_died"; payload: { id: string } }
  | { type: "countdown"; payload: { seconds: number } }
  | { type: "race_start"; payload: { seed: string } }
  | { type: "race_end"; payload: { results: RaceResult[] } };

// ── Game State ──
export interface GameState {
  score: number;
  distance: number;
  obstaclesCleared: number;
  alive: boolean;
  speed: number;
}
