import fs from "fs";
import path from "path";
import type { DifficultyScoreBreakdown, ValidationResult } from "./types";

export interface ReviewQueueItem {
  readonly id: string;
  readonly clueWords: readonly [string, string];
  readonly answerWords: readonly [string, string];
  readonly relationships: readonly [string, string];
  readonly qualityScore: number;
  readonly difficultyScore: number;
  readonly recommendedTier: string;
  readonly reviewNotes: string;
}

/**
 * Exports borderline candidates and tricky edge cases to JSON and CSV formats
 * for human editorial inspection and approval overrides.
 */
export function exportReviewQueue(
  items: readonly {
    readonly validation: ValidationResult;
    readonly difficulty: DifficultyScoreBreakdown;
  }[],
  outputDir = path.join("data", "corpus")
): { jsonPath: string; csvPath: string; count: number } {
  fs.mkdirSync(outputDir, { recursive: true });

  const queueItems: ReviewQueueItem[] = items.map(({ validation, difficulty }) => {
    const cand = validation.candidate;
    return {
      id: cand.id,
      clueWords: cand.clueWords,
      answerWords: cand.answerWords,
      relationships: [
        cand.transformations[0]?.relationship ?? "UNKNOWN",
        cand.transformations[1]?.relationship ?? "UNKNOWN",
      ],
      qualityScore: validation.qualityScore,
      difficultyScore: difficulty.score,
      recommendedTier: difficulty.tier,
      reviewNotes:
        validation.reviewNotes ||
        `High difficulty (${difficulty.score}) with ${difficulty.antonymCount} antonyms.`,
    };
  });

  const jsonPath = path.join(outputDir, "review-queue.json");
  fs.writeFileSync(jsonPath, JSON.stringify(queueItems, null, 2), "utf-8");

  // CSV format
  const csvHeaders = [
    "id",
    "clue1",
    "clue2",
    "answer1",
    "answer2",
    "rel1",
    "rel2",
    "qualityScore",
    "difficultyScore",
    "recommendedTier",
    "reviewNotes",
  ];

  const csvRows = queueItems.map((item) =>
    [
      item.id,
      item.clueWords[0],
      item.clueWords[1],
      item.answerWords[0],
      item.answerWords[1],
      item.relationships[0],
      item.relationships[1],
      item.qualityScore,
      item.difficultyScore,
      item.recommendedTier,
      `"${item.reviewNotes.replace(/"/g, '""')}"`,
    ].join(",")
  );

  const csvContent = [csvHeaders.join(","), ...csvRows].join("\n");
  const csvPath = path.join(outputDir, "review-queue.csv");
  fs.writeFileSync(csvPath, csvContent, "utf-8");

  return {
    jsonPath,
    csvPath,
    count: queueItems.length,
  };
}
