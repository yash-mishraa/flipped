import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import HomePage from "@/app/page";

describe("Application Shell (HomePage)", () => {
  it("renders the game title and tagline", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: "Flipped", level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/The tactile word puzzle where letters shift/i)).toBeInTheDocument();
  });

  it("renders both Daily and Classic mode informational cards", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: "Daily Puzzle", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Classic Mode", level: 3 })).toBeInTheDocument();
  });

  it("displays the explicit development notice about gameplay mechanics", () => {
    render(<HomePage />);
    expect(
      screen.getByText(/Development Notice — Gameplay Mechanics Pending/i)
    ).toBeInTheDocument();
  });
});
