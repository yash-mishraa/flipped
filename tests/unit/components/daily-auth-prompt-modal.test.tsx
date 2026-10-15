import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DailyAuthPromptModal } from "@/features/game/components/DailyAuthPromptModal";
import { DailyCompletionCard } from "@/features/game/components/DailyCompletionCard";
import { TEST_PUZZLES } from "@/features/game/data/test-puzzles";
import type { DailyAttemptRecord } from "@/features/game/modes/mode-types";

// Mock Clerk auth
vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ isSignedIn: false, user: null }),
  SignInButton: ({ children }: { children: React.ReactNode }) => <div data-testid="clerk-sign-in">{children}</div>,
  SignUpButton: ({ children }: { children: React.ReactNode }) => <div data-testid="clerk-sign-up">{children}</div>,
  Show: ({ when, children }: { when: string; children: React.ReactNode }) => (when === "signed-out" ? <>{children}</> : null),
}));

// Mock confetti
vi.mock("@/features/game/utils/confetti", () => ({
  triggerVictoryConfetti: vi.fn(),
}));

describe("DailyAuthPromptModal", () => {
  it("renders prompt message, streak, and preservation notice when open", () => {
    const onClose = vi.fn();
    render(
      <DailyAuthPromptModal
        isOpen={true}
        onClose={onClose}
        isWon={true}
        streak={3}
      />
    );

    // Exact prompt requirement
    expect(
      screen.getByText("Login or create an account in order to sync and save your progress.")
    ).toBeInTheDocument();

    // Streak badge
    expect(screen.getByText("3 Day Streak")).toBeInTheDocument();

    // Reassurance that local streak is kept in the browser
    expect(
      screen.getByText(/Guest streak preserved/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/will remain saved safely right here in this browser/i)
    ).toBeInTheDocument();

    // CTAs
    expect(screen.getByText("Create Free Account")).toBeInTheDocument();
    expect(screen.getByText("Already Have an Account? Log In")).toBeInTheDocument();
    expect(screen.getByText("Keep Streak Locally in Browser (Maybe Later)")).toBeInTheDocument();

    // Dismissal button triggers onClose
    fireEvent.click(screen.getByText("Keep Streak Locally in Browser (Maybe Later)"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when close icon (X) is clicked", () => {
    const onClose = vi.fn();
    render(
      <DailyAuthPromptModal
        isOpen={true}
        onClose={onClose}
        isWon={true}
        streak={1}
      />
    );

    const closeBtn = screen.getByRole("button", { name: /Close dialog/i });
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape key is pressed", () => {
    const onClose = vi.fn();
    render(
      <DailyAuthPromptModal
        isOpen={true}
        onClose={onClose}
        isWon={true}
        streak={1}
      />
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not render when isOpen is false", () => {
    render(
      <DailyAuthPromptModal
        isOpen={false}
        onClose={vi.fn()}
        isWon={true}
        streak={1}
      />
    );

    expect(
      screen.queryByText("Login or create an account in order to sync and save your progress.")
    ).not.toBeInTheDocument();
  });
});

describe("DailyCompletionCard Guest Auth Sync Integration", () => {
  const fastFoodPuzzle = TEST_PUZZLES[0]!;
  const attempt: DailyAttemptRecord = {
    date: "2026-10-15",
    puzzleId: fastFoodPuzzle.id,
    status: "WON",
    finalScore: 95,
    elapsedSeconds: 22,
    hintsUsed: 0,
    completedAt: "2026-10-15T10:00:00Z",
  };

  it("displays local browser streak reassurance banner with sync button for guest users", () => {
    render(
      <DailyCompletionCard
        date="2026-10-15"
        puzzle={fastFoodPuzzle}
        attempt={attempt}
      />
    );

    expect(screen.getByText(/Guest Session:/i)).toBeInTheDocument();
    expect(screen.getByText(/saved locally in this browser/i)).toBeInTheDocument();

    const syncBtn = screen.getByRole("button", { name: /Sync with Account/i });
    expect(syncBtn).toBeInTheDocument();

    // Clicking sync button opens the modal
    fireEvent.click(syncBtn);
    expect(
      screen.getByText("Login or create an account in order to sync and save your progress.")
    ).toBeInTheDocument();
  });
});
