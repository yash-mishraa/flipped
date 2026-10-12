import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { CURATED_PUZZLES } from "../../../src/features/game/data/puzzles";
import { PUBLIC_PUZZLE_METADATA } from "../../../src/features/game/data/public-puzzles";
import { LEGACY_CURATED_PUZZLES } from "../../../src/features/game/data/legacy-curated-puzzles";
import { CORPUS_MANIFEST } from "../../../scripts/corpus/manifest";

describe("Corpus Integrity Audit — Targets, Balance, & Backwards Compatibility", () => {
  it("exceeds the scale target of >= 3,000 validated unique puzzles", () => {
    expect(CURATED_PUZZLES.length).toBeGreaterThanOrEqual(3000);
  });

  it("permanently preserves all 20 legacy curated puzzles at indices 0 through 19", () => {
    expect(LEGACY_CURATED_PUZZLES).toHaveLength(20);

    for (let i = 0; i < 20; i++) {
      const legacy = LEGACY_CURATED_PUZZLES[i]!;
      const actual = CURATED_PUZZLES[i]!;

      expect(actual.id).toBe(legacy.id);
      expect(actual.clueWords).toEqual(legacy.clueWords);
      expect(actual.answerWords).toEqual(legacy.answerWords);
      expect(actual.difficulty).toBe(legacy.difficulty);
      expect(actual.transformations).toEqual(legacy.transformations);
    }
  });

  it("ensures all puzzle IDs across the entire corpus are strictly unique", () => {
    const idSet = new Set<string>();
    for (const puzzle of CURATED_PUZZLES) {
      expect(idSet.has(puzzle.id)).toBe(false);
      idSet.add(puzzle.id);
    }
    expect(idSet.size).toBe(CURATED_PUZZLES.length);
  });

  it("maintains a balanced distribution across Easy, Medium, and Hard tiers", () => {
    const counts = { EASY: 0, MEDIUM: 0, HARD: 0 };
    for (const p of CURATED_PUZZLES) {
      counts[p.difficulty]++;
    }

    expect(counts.EASY).toBeGreaterThanOrEqual(800);
    expect(counts.MEDIUM).toBeGreaterThanOrEqual(1200);
    expect(counts.HARD).toBeGreaterThanOrEqual(800);
  });

  it("ensures public puzzle metadata matches corpus length without leaking answers", () => {
    expect(PUBLIC_PUZZLE_METADATA.length).toBe(CURATED_PUZZLES.length);

    for (const meta of PUBLIC_PUZZLE_METADATA) {
      expect(meta.id).toBeDefined();
      expect(meta.clueWords).toHaveLength(2);
      expect(meta.wordLengths).toHaveLength(2);
      expect((meta as unknown as Record<string, unknown>).answerWords).toBeUndefined();
      expect((meta as unknown as Record<string, unknown>).transformations).toBeUndefined();
    }
  });

  it("verifies that exportable review queue artifacts exist in JSON and CSV formats", () => {
    const jsonPath = path.join("data", "corpus", "review-queue.json");
    const csvPath = path.join("data", "corpus", "review-queue.csv");

    expect(fs.existsSync(jsonPath)).toBe(true);
    expect(fs.existsSync(csvPath)).toBe(true);

    const jsonData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    expect(Array.isArray(jsonData)).toBe(true);
    expect(jsonData.length).toBeGreaterThan(0);
  });

  it("verifies that corpus statistics JSON exists with required properties", () => {
    const statsPath = path.join("data", "corpus", "corpus-stats.json");
    expect(fs.existsSync(statsPath)).toBe(true);

    const stats = JSON.parse(fs.readFileSync(statsPath, "utf-8"));
    expect(stats.totalCandidatesGenerated).toBeGreaterThanOrEqual(10000);
    expect(stats.totalApproved).toBeGreaterThanOrEqual(3000);
    expect(stats.difficultyDistribution).toBeDefined();
    expect(stats.rejectionBreakdown).toBeDefined();
  });

  it("documents source licenses and attributions in the manifest", () => {
    const names = CORPUS_MANIFEST.map((s) => s.name);
    expect(names).toContain("Princeton WordNet");
    expect(names).toContain("Open English WordNet");
    expect(names).toContain("wordfreq / SUBTLEX-US Word Frequency Dataset");
  });
});
