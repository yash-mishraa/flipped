import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BorderGlow } from "@/components/ui/BorderGlow";

describe("BorderGlow Component", () => {
  it("renders children correctly inside the inner container", () => {
    render(
      <BorderGlow>
        <div data-testid="glow-content">Hello Glow</div>
      </BorderGlow>
    );

    const content = screen.getByTestId("glow-content");
    expect(content).toBeInTheDocument();
    expect(content).toHaveTextContent("Hello Glow");
  });

  it("applies dark theme by default and computes CSS custom properties", () => {
    const { container } = render(
      <BorderGlow
        backgroundColor="#120F17"
        borderRadius={32}
        glowRadius={48}
        coneSpread={30}
        edgeSensitivity={25}
        fillOpacity={0.6}
        colors={["#c084fc", "#f472b6", "#38bdf8"]}
      >
        <p>Dark Glow</p>
      </BorderGlow>
    );

    const card = container.querySelector(".border-glow-card") as HTMLElement;
    expect(card).toBeInTheDocument();
    expect(card.classList.contains("border-glow-card--light")).toBe(false);

    expect(card.style.getPropertyValue("--card-bg")).toBe("#120F17");
    expect(card.style.getPropertyValue("--border-radius")).toBe("32px");
    expect(card.style.getPropertyValue("--glow-padding")).toBe("48px");
    expect(card.style.getPropertyValue("--cone-spread")).toBe("30");
    expect(card.style.getPropertyValue("--edge-sensitivity")).toBe("25");
    expect(card.style.getPropertyValue("--fill-opacity")).toBe("0.6");
  });

  it("adds border-glow-card--light class for light surface colors", () => {
    const { container } = render(
      <BorderGlow backgroundColor="#FFFFFF">
        <p>Light Glow</p>
      </BorderGlow>
    );

    const card = container.querySelector(".border-glow-card") as HTMLElement;
    expect(card).toBeInTheDocument();
    expect(card.classList.contains("border-glow-card--light")).toBe(true);
  });

  it("updates edge proximity and cursor angle on pointer move", () => {
    const { container } = render(
      <BorderGlow>
        <p>Interactive Card</p>
      </BorderGlow>
    );

    const card = container.querySelector(".border-glow-card") as HTMLElement;
    expect(card).toBeInTheDocument();

    // Mock getBoundingClientRect
    vi.spyOn(card, "getBoundingClientRect").mockReturnValue({
      width: 400,
      height: 200,
      left: 100,
      top: 100,
      right: 500,
      bottom: 300,
      x: 100,
      y: 100,
      toJSON: () => {},
    });

    fireEvent.pointerMove(card, { clientX: 200, clientY: 150 });

    expect(card.style.getPropertyValue("--edge-proximity")).toBeDefined();
    expect(card.style.getPropertyValue("--cursor-angle")).toBeDefined();
  });

  it("handles onClick callback when clicked", () => {
    const handleClick = vi.fn();
    const { container } = render(
      <BorderGlow onClick={handleClick}>
        <p>Clickable Card</p>
      </BorderGlow>
    );

    const card = container.querySelector(".border-glow-card") as HTMLElement;
    fireEvent.click(card);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("initiates sweep-active class when animated is true", () => {
    const { container } = render(
      <BorderGlow animated={true}>
        <p>Animated Sweep Card</p>
      </BorderGlow>
    );

    const card = container.querySelector(".border-glow-card") as HTMLElement;
    expect(card).toBeInTheDocument();
    expect(card.classList.contains("sweep-active")).toBe(true);
  });
});
