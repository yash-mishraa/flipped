import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TutorialModal } from "@/features/game/components/TutorialModal";
import {
  isOnboardingCompleted,
  setOnboardingCompleted,
} from "@/features/game/persistence/local-progress";

describe("TutorialModal Component", () => {
  beforeEach(() => {
    setOnboardingCompleted(false);
  });

  it("does not render when isOpen is false", () => {
    render(<TutorialModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders when isOpen is true and advances through steps", () => {
    const handleClose = vi.fn();
    render(<TutorialModal isOpen={true} onClose={handleClose} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
    expect(screen.getByText("The Core Goal")).toBeInTheDocument();

    // Click Next
    fireEvent.click(screen.getByText("Next"));
    expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
    expect(screen.getByText("Interactive Letter Grid")).toBeInTheDocument();

    // Click Next again
    fireEvent.click(screen.getByText("Next"));
    expect(screen.getByText("Step 3 of 3")).toBeInTheDocument();
    expect(screen.getByText("60-Second Countdown")).toBeInTheDocument();

    // Finish
    const finishBtn = screen.getByTestId("start-playing-button");
    fireEvent.click(finishBtn);

    expect(handleClose).toHaveBeenCalled();
    expect(isOnboardingCompleted()).toBe(true);
  });

  it("skipping the tutorial marks onboarding complete and closes", () => {
    const handleClose = vi.fn();
    render(<TutorialModal isOpen={true} onClose={handleClose} />);

    const skipBtn = screen.getByText("Skip Tutorial");
    fireEvent.click(skipBtn);

    expect(handleClose).toHaveBeenCalled();
    expect(isOnboardingCompleted()).toBe(true);
  });

  it("closing via Escape key calls onClose and marks complete", () => {
    const handleClose = vi.fn();
    render(<TutorialModal isOpen={true} onClose={handleClose} />);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleClose).toHaveBeenCalled();
    expect(isOnboardingCompleted()).toBe(true);
  });
});
