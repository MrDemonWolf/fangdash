import { describe, it, expect } from "vitest";
import { SKINS, getSkinById, getSkinsByRarity, DEFAULT_SKIN_ID } from "../skins";

describe("Skins", () => {
  it("has a default skin", () => {
    const defaultSkin = getSkinById(DEFAULT_SKIN_ID);
    expect(defaultSkin).toBeDefined();
    expect(defaultSkin!.id).toBe("gray-wolf");
    expect(defaultSkin!.unlockCondition.type).toBe("default");
  });

  it("all skins have unique IDs", () => {
    const ids = SKINS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all skins have unique spriteKeys", () => {
    const keys = SKINS.map((s) => s.spriteKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("getSkinById returns undefined for unknown ID", () => {
    expect(getSkinById("nonexistent")).toBeUndefined();
  });

  it("getSkinsByRarity filters correctly", () => {
    const commons = getSkinsByRarity("common");
    expect(commons.length).toBeGreaterThan(0);
    expect(commons.every((s) => s.rarity === "common")).toBe(true);
  });

  it("has at least one skin per used rarity", () => {
    const usedRarities = [...new Set(SKINS.map((s) => s.rarity))];
    for (const rarity of usedRarities) {
      expect(getSkinsByRarity(rarity).length).toBeGreaterThan(0);
    }
  });

  it("has exactly 6 skins", () => {
    expect(SKINS.length).toBe(6);
  });
});
