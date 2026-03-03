import type { SkinDefinition } from "./types";

export const SKINS: SkinDefinition[] = [
  {
    id: "gray-wolf",
    name: "Gray Wolf",
    description: "The classic gray wolf. Swift and reliable.",
    rarity: "common",
    spriteKey: "wolf-gray",
    unlockCondition: { type: "default" },
  },
  {
    id: "shadow-wolf",
    name: "Shadow Wolf",
    description: "Moves through darkness unseen.",
    rarity: "uncommon",
    spriteKey: "wolf-shadow",
    unlockCondition: { type: "distance", threshold: 2000 },
  },
  {
    id: "fire-wolf",
    name: "Fire Wolf",
    description: "Blazing with untamed fury.",
    rarity: "rare",
    spriteKey: "wolf-fire",
    unlockCondition: { type: "score", threshold: 5000 },
  },
  {
    id: "storm-wolf",
    name: "Storm Wolf",
    description: "Crackling with electric energy.",
    rarity: "epic",
    spriteKey: "wolf-storm",
    unlockCondition: { type: "achievement", achievementId: "obstacle-master" },
  },
  {
    id: "blood-moon-wolf",
    name: "Blood Moon Wolf",
    description: "Awakened under the crimson moon.",
    rarity: "legendary",
    spriteKey: "wolf-blood-moon",
    unlockCondition: { type: "score", threshold: 15000 },
  },
  {
    id: "mrdemonwolf",
    name: "MrDemonWolf",
    description: "The one and only. A wolf forged in code and chaos.",
    rarity: "legendary",
    spriteKey: "wolf-mrdemonwolf",
    unlockCondition: { type: "achievement", achievementId: "champion" },
  },
];

export const DEFAULT_SKIN_ID = "gray-wolf";

export function getSkinById(id: string): SkinDefinition | undefined {
  return SKINS.find((s) => s.id === id);
}

export function getSkinsByRarity(rarity: SkinDefinition["rarity"]): SkinDefinition[] {
  return SKINS.filter((s) => s.rarity === rarity);
}
