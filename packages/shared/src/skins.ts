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
    id: "timber-wolf",
    name: "Timber Wolf",
    description: "A sturdy brown timber wolf.",
    rarity: "common",
    spriteKey: "wolf-timber",
    unlockCondition: { type: "games_played", count: 5 },
  },
  {
    id: "arctic-wolf",
    name: "Arctic Wolf",
    description: "White as snow, fast as the wind.",
    rarity: "uncommon",
    spriteKey: "wolf-arctic",
    unlockCondition: { type: "score", threshold: 1000 },
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
    id: "ember-wolf",
    name: "Ember Wolf",
    description: "Eyes that glow like burning coals.",
    rarity: "rare",
    spriteKey: "wolf-ember",
    unlockCondition: { type: "score", threshold: 5000 },
  },
  {
    id: "frost-wolf",
    name: "Frost Wolf",
    description: "Leaves ice crystals in its wake.",
    rarity: "rare",
    spriteKey: "wolf-frost",
    unlockCondition: { type: "achievement", achievementId: "marathon-runner" },
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
    rarity: "epic",
    spriteKey: "wolf-bloodmoon",
    unlockCondition: { type: "score", threshold: 15000 },
  },
  {
    id: "alpha-wolf",
    name: "Alpha Wolf",
    description: "The undisputed leader of the pack.",
    rarity: "legendary",
    spriteKey: "wolf-alpha",
    unlockCondition: { type: "achievement", achievementId: "champion" },
  },
  {
    id: "phantom-wolf",
    name: "Phantom Wolf",
    description: "A ghostly apparition between worlds.",
    rarity: "legendary",
    spriteKey: "wolf-phantom",
    unlockCondition: { type: "distance", threshold: 10000 },
  },
];

export const DEFAULT_SKIN_ID = "gray-wolf";

export function getSkinById(id: string): SkinDefinition | undefined {
  return SKINS.find((s) => s.id === id);
}

export function getSkinsByRarity(rarity: SkinDefinition["rarity"]): SkinDefinition[] {
  return SKINS.filter((s) => s.rarity === rarity);
}
