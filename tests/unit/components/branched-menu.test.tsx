import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import BranchedMenu, { type BranchedMenuSection } from "@/components/ui/BranchedMenu";

describe("BranchedMenu Component", () => {
  const sampleItems: readonly BranchedMenuSection[] = [
    {
      label: "Play Modes",
      children: [
        { value: "daily", label: "Daily Challenge" },
        { value: "classic", label: "Classic Sprint" },
        { value: "archive", label: "Archive" },
      ],
    },
    {
      label: "Account",
      children: [
        { value: "stats", label: "Statistics" },
        { value: "settings", label: "Settings" },
      ],
    },
  ];

  it("renders sections and child items with branch SVG tree", () => {
    const { container } = render(
      <BranchedMenu
        items={sampleItems}
        defaultOpen={[0, 1]}
        defaultActive="daily"
        color="#32171D"
        accentColor="#7B1E2B"
        lineColor="#C49A6C"
      />
    );

    expect(screen.getByRole("button", { name: "Play Modes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Account" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Daily Challenge" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Classic Sprint" })).toBeInTheDocument();

    const svgs = container.querySelectorAll("svg.branched-menu__lines");
    expect(svgs.length).toBe(2);
  });

  it("calls onSelect when a menu child item is clicked", () => {
    const onSelect = vi.fn();
    render(
      <BranchedMenu
        items={sampleItems}
        defaultOpen={[0]}
        defaultActive="daily"
        onSelect={onSelect}
      />
    );

    const classicBtn = screen.getByRole("button", { name: "Classic Sprint" });
    fireEvent.click(classicBtn);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(
      "classic",
      expect.objectContaining({ value: "classic", label: "Classic Sprint" })
    );
  });

  it("toggles section folding and fires onToggle callback", () => {
    const onToggle = vi.fn();
    render(
      <BranchedMenu
        items={sampleItems}
        defaultOpen={[0]}
        defaultActive="daily"
        onToggle={onToggle}
      />
    );

    const accountHeader = screen.getByRole("button", { name: "Account" });
    fireEvent.click(accountHeader);

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith(1, true);

    // Click again to fold
    fireEvent.click(accountHeader);
    expect(onToggle).toHaveBeenCalledTimes(2);
    expect(onToggle).toHaveBeenCalledWith(1, false);
  });
});
