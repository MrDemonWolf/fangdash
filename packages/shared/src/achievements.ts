import { MOD_FOG, MOD_HEADWIND, MOD_TREMOR } from "./mods.ts";
import type { AchievementDefinition } from "./types.ts";

export const ACHIEVEMENTS: AchievementDefinition[] = [
	// ── Score Achievements ──
	{
		id: "first-fang",
		name: "First Fang",
		description: "Score 100 points in a single run.",
		category: "score",
		icon: "🐺",
		condition: { type: "score_single", threshold: 100 },
	},
	{
		id: "sharp-fangs",
		name: "Sharp Fangs",
		description: "Score 1,000 points in a single run.",
		category: "score",
		icon: "⚡",
		condition: { type: "score_single", threshold: 1000 },
	},
	{
		id: "apex-predator",
		name: "Apex Predator",
		description: "Score 10,000 points in a single run.",
		category: "score",
		icon: "👑",
		condition: { type: "score_single", threshold: 10000 },
	},
	{
		id: "score-hoarder",
		name: "Score Hoarder",
		description: "Accumulate 50,000 total points across all runs.",
		category: "score",
		icon: "💰",
		condition: { type: "score_total", threshold: 50000 },
	},

	// ── Distance Achievements ──
	{
		id: "first-steps",
		name: "First Steps",
		description: "Run 500 meters in a single run.",
		category: "distance",
		icon: "🐾",
		condition: { type: "distance_single", threshold: 500 },
	},
	{
		id: "marathon-runner",
		name: "Marathon Runner",
		description: "Run 5,000 meters in a single run.",
		category: "distance",
		icon: "🏃",
		condition: { type: "distance_single", threshold: 5000 },
		rewardSkinId: "fire-wolf",
	},
	{
		id: "world-traveler",
		name: "World Traveler",
		description: "Run 50,000 total meters across all runs.",
		category: "distance",
		icon: "🌍",
		condition: { type: "distance_total", threshold: 50000 },
	},

	// ── Games Played Achievements ──
	{
		id: "pup",
		name: "Pup",
		description: "Play your first game.",
		category: "games",
		icon: "🐶",
		condition: { type: "games_played", count: 1 },
	},
	{
		id: "pack-member",
		name: "Pack Member",
		description: "Play 25 games.",
		category: "games",
		icon: "🐺",
		condition: { type: "games_played", count: 25 },
	},
	{
		id: "lone-wolf",
		name: "Lone Wolf",
		description: "Play 100 games.",
		category: "games",
		icon: "🌙",
		condition: { type: "games_played", count: 100 },
	},

	// ── Skill Achievements ──
	{
		id: "obstacle-dodger",
		name: "Obstacle Dodger",
		description: "Clear 100 obstacles total.",
		category: "skill",
		icon: "🔥",
		condition: { type: "obstacles_cleared", count: 100 },
	},
	{
		id: "obstacle-master",
		name: "Obstacle Master",
		description: "Clear 1,000 obstacles total.",
		category: "skill",
		icon: "⭐",
		condition: { type: "obstacles_cleared", count: 1000 },
		rewardSkinId: "storm-wolf",
	},
	{
		id: "perfect-dash",
		name: "Perfect Dash",
		description: "Run 1,000 meters without hitting any obstacles.",
		category: "skill",
		icon: "💎",
		condition: { type: "perfect_run", distance: 1000 },
	},

	// ── Social / Racing Achievements ──
	{
		id: "first-race",
		name: "First Race",
		description: "Complete your first race.",
		category: "social",
		icon: "🏁",
		condition: { type: "races_played", count: 1 },
	},
	{
		id: "champion",
		name: "Champion",
		description: "Win 10 races.",
		category: "social",
		icon: "🏆",
		condition: { type: "races_won", count: 10 },
		rewardSkinId: "mrdemonwolf",
	},
	{
		id: "veteran-racer",
		name: "Veteran Racer",
		description: "Complete 50 races.",
		category: "social",
		icon: "🎖️",
		condition: { type: "races_played", count: 50 },
	},

	// ── Mod Achievements ──
	{
		id: "fog-runner",
		name: "Fog Runner",
		description: "Run 2,000 meters with Fog active.",
		category: "skill",
		icon: "🌫️",
		condition: { type: "distance_with_mods", threshold: 2000, mods: MOD_FOG },
	},
	{
		id: "headwind-hero",
		name: "Headwind Hero",
		description: "Score 5,000 points with Headwind active.",
		category: "skill",
		icon: "💨",
		condition: { type: "score_with_mods", threshold: 5000, mods: MOD_HEADWIND },
	},
	{
		id: "triple-threat",
		name: "Triple Threat",
		description: "Score 3,000 points with all three mods active.",
		category: "skill",
		icon: "🌪️",
		condition: {
			type: "score_with_mods",
			threshold: 3000,
			mods: MOD_FOG | MOD_HEADWIND | MOD_TREMOR,
		},
	},
	{
		id: "endurance-wolf",
		name: "Endurance Wolf",
		description: "Survive for 2 minutes in a single run.",
		category: "skill",
		icon: "⏱️",
		condition: { type: "time_survived", threshold: 120000 },
	},
	{
		id: "obstacle-gauntlet",
		name: "Obstacle Gauntlet",
		description: "Clear 500 obstacles in a single run.",
		category: "skill",
		icon: "🏋️",
		condition: { type: "obstacles_cleared", count: 500 },
	},
];

export function getAchievementById(id: string): AchievementDefinition | undefined {
	return ACHIEVEMENTS.find((a) => a.id === id);
}

export function getAchievementsByCategory(
	category: AchievementDefinition["category"],
): AchievementDefinition[] {
	return ACHIEVEMENTS.filter((a) => a.category === category);
}
