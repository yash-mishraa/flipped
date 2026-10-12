import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import HomePage from "@/app/page";
import { setOnboardingCompleted } from "@/features/game/persistence/local-progress";

describe("Production Home Screen (HomePage)", () => {
  beforeEach(() => {
    setOnboardingCompleted(true); // Prevent auto-opening tutorial during home screen layout tests
  });

  it("renders the game title and core challenge headline", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: "FLIPPED", level: 1 })).toBeInTheDocument();
    expect(
      screen.getByText(/Flip the meanings of two clue words to uncover a familiar phrase/i)
    ).toBeInTheDocument();
  });

  it("renders both Daily and Classic mode challenge sections", () => {
    render(<HomePage />);
    expect(screen.getByTestId("home-daily-card")).toBeInTheDocument();
    expect(screen.getByTestId("home-classic-card")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Daily Mode", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Classic Mode", level: 2 })).toBeInTheDocument();
  });

  it("renders How Flipped Works section with semantic examples", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", { name: "How Flipped Works", level: 2 })
    ).toBeInTheDocument();
    expect(screen.getByText("SLOW + MEAL")).toBeInTheDocument();
    expect(screen.getByText("FAST FOOD")).toBeInTheDocument();
  });

  it("renders navigation links to Archive and Statistics", () => {
    render(<HomePage />);
    expect(screen.getAllByRole("link", { name: /Archive/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Statistics/i })[0]).toBeInTheDocument();
  });
});
