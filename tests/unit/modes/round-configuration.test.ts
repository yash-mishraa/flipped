import { describe, it, expect, beforeEach } from "vitest";
import {
  createDailyRoundConfiguration,
  createClassicRoundConfiguration,
} from "@/features/game/modes/round-configuration";
import { saveDailyAttempt, clearProgress } from "@/features/game/persistence/local-progress";

describe("Round Configuration Factory", () => {
  beforeEach(() => {
    clearProgress();
  });

  describe("createDailyRoundConfiguration", () => {
    it("creates an unplayed daily configuration for a valid published date", () => {
      const result = createDailyRoundConfiguration("2026-10-12");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.config.mode).toBe("DAILY");
        expect(result.config.puzzle.id).toBe("bitter-truth");
        expect(result.config.isReadOnly).toBe(false);
        expect(result.config.previousResult).toBeUndefined();
      }
    });

    it("marks configuration as read-only if the player already attempted today's puzzle", () => {
      saveDailyAttempt({
        date: "2026-10-12",
        puzzleId: "bitter-truth",
        status: "WON",
        finalScore: 820,
        elapsedSeconds: 28,
        hintsUsed: 1,
        solvedPhrase: "BITTER TRUTH",
        completedAt: new Date().toISOString(),
      });

      const result = createDailyRoundConfiguration("2026-10-12");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.config.isReadOnly).toBe(true);
        expect(result.config.previousResult).toBeDefined();
        expect(result.config.previousResult?.status).toBe("WON");
      }
    });

    it("returns failure for future dates", () => {
      const result = createDailyRoundConfiguration("2099-06-15");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.result.status).toBe("FUTURE_UNPUBLISHED");
      }
    });
  });

  describe("createClassicRoundConfiguration", () => {
    it("creates an active classic round configuration for the given tier", () => {
      const result = createClassicRoundConfiguration("HARD");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.config.mode).toBe("CLASSIC");
        expect(result.config.difficulty).toBe("HARD");
        expect(result.config.puzzle.difficulty).toBe("HARD");
        expect(result.config.isReadOnly).toBe(false);
      }
    });
  });
});
