import { describe, it, expect } from "vitest";
import { APP_CONFIG, GAME_MODES } from "@/features/game";

describe("Game Constants & Mode Configuration", () => {
  it("defines core application metadata", () => {
    expect(APP_CONFIG.name).toBe("Flipped");
    expect(APP_CONFIG.tagline.length).toBeGreaterThan(10);
    expect(APP_CONFIG.version).toBeDefined();
  });

  it("configures exactly two game modes: Daily and Classic", () => {
    expect(GAME_MODES).toHaveLength(2);
    const modes = GAME_MODES.map((m) => m.mode);
    expect(modes).toContain("daily");
    expect(modes).toContain("classic");
  });

  it("provides complete metadata and planned feature lists for both modes", () => {
    for (const mode of GAME_MODES) {
      expect(mode.title).toBeTruthy();
      expect(mode.badge).toBeTruthy();
      expect(mode.description).toBeTruthy();
      expect(mode.features.length).toBeGreaterThan(0);
    }
  });
});
