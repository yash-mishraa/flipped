import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { formatShareText, shareResult } from "@/features/game/utils/share-result";
import { ShareButton } from "@/features/game/components/ShareButton";

describe("Result Sharing System", () => {
  describe("formatShareText", () => {
    it("formats Daily win text without exposing answer words", () => {
      const text = formatShareText({
        mode: "DAILY",
        date: "2026-10-12",
        isWon: true,
        score: 92,
        elapsedSeconds: 22,
        hintsUsed: 1,
        wordLengths: [4, 4],
      });

      expect(text).toContain("Flipped Daily • 2026-10-12");
      expect(text).toContain("🎯 Solved in 22s • Score: 92/100");
      expect(text).toContain("💡 Hints Used: 1");
      expect(text).toContain("🟩🟩🟩🟩 🟩🟩🟩🟩");
      // Answer words must NOT appear
      expect(text).not.toContain("FAST");
      expect(text).not.toContain("FOOD");
    });

    it("formats Daily timeout text without leaking solution", () => {
      const text = formatShareText({
        mode: "DAILY",
        date: "2026-10-12",
        isWon: false,
        score: 0,
        elapsedSeconds: 60,
        hintsUsed: 2,
      });

      expect(text).toContain("Flipped Daily • 2026-10-12");
      expect(text).toContain("⌛ Time Limit Reached (60s)");
      expect(text).toContain("💡 Hints Used: 2");
    });

    it("formats Classic practice text", () => {
      const text = formatShareText({
        mode: "CLASSIC",
        isWon: true,
        score: 95,
        elapsedSeconds: 15,
        hintsUsed: 0,
      });

      expect(text).toContain("Flipped Classic Practice");
      expect(text).toContain("🎯 Solved in 15s • Score: 95/100");
    });

    it("formats Classic Sprint text with multi-puzzle score and correct boxes", () => {
      const text = formatShareText({
        mode: "CLASSIC",
        isWon: true,
        score: 377,
        elapsedSeconds: 60,
        hintsUsed: 3,
        sprintPuzzlesSolved: 4,
      });

      expect(text).toContain("Flipped Classic Sprint (60s)");
      expect(text).toContain("⚡ Solved: 4 Puzzles • Score: 377 pts");
      expect(text).not.toContain("377/100"); // Must never show 377/100
      expect(text).toContain("💡 Hints Used: 3");
      expect(text).toContain("🟩 🟩 🟩 🟩"); // Exactly 4 boxes for 4 solved puzzles
      expect(text).toContain("flipped.website/classic");
    });
  });

  describe("shareResult helper", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("uses navigator.share when available", async () => {
      const shareMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "share", {
        value: shareMock,
        writable: true,
        configurable: true,
      });

      const outcome = await shareResult({
        mode: "DAILY",
        date: "2026-10-12",
        isWon: true,
        score: 90,
        elapsedSeconds: 20,
        hintsUsed: 0,
      });

      expect(shareMock).toHaveBeenCalled();
      expect(outcome.success).toBe(true);
      expect(outcome.method).toBe("share");
    });

    it("falls back to navigator.clipboard.writeText when navigator.share is unavailable", async () => {
      Object.defineProperty(navigator, "share", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      });

      const outcome = await shareResult({
        mode: "DAILY",
        date: "2026-10-12",
        isWon: true,
        score: 90,
        elapsedSeconds: 20,
        hintsUsed: 0,
      });

      expect(writeTextMock).toHaveBeenCalled();
      expect(outcome.success).toBe(true);
      expect(outcome.method).toBe("clipboard");
    });
  });

  describe("ShareButton component", () => {
    it("renders and triggers copy with feedback", async () => {
      Object.defineProperty(navigator, "share", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      });

      render(
        <ShareButton
          options={{
            mode: "DAILY",
            date: "2026-10-12",
            isWon: true,
            score: 95,
            elapsedSeconds: 15,
            hintsUsed: 0,
          }}
        />
      );

      const button = screen.getByTestId("share-result-button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("Share Result");

      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText("Copied to Clipboard!")).toBeInTheDocument();
      });
    });
  });
});
