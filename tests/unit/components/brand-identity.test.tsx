import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { FlippedSymbol, FlippedLogo } from "@/components/FlippedLogo";
import { SplashIntro } from "@/components/SplashIntro";
import fs from "fs";
import path from "path";

describe("Brand Identity System — Specifications & Components", () => {
  it("renders the standalone FlippedSymbol with exact 64-unit vector geometry", () => {
    const { container } = render(<FlippedSymbol size={32} variant="crimson" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("viewBox", "0 0 64 64");
    expect(svg).toHaveAttribute("width", "32");
    expect(svg).toHaveAttribute("height", "32");

    const path = svg?.querySelector("path");
    expect(path).toBeInTheDocument();
    // Path 1 (top bar + spine) and Path 2 (middle tile)
    expect(path).toHaveAttribute(
      "d",
      "M 0 0 L 64 0 L 48 16 L 16 16 L 16 64 L 0 64 Z M 24 24 L 56 24 L 40 40 L 24 40 Z"
    );
    expect(path).toHaveAttribute("fill", "#7B1E2B");
  });

  it("renders boxed variants (cream-on-crimson) with background rect and inset mark", () => {
    const { container } = render(<FlippedSymbol size={48} variant="cream-on-crimson" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();

    const rect = svg?.querySelector("rect");
    expect(rect).toBeInTheDocument();
    expect(rect).toHaveAttribute("fill", "#7B1E2B");

    const symbolPath = svg?.querySelector("path");
    expect(symbolPath).toHaveAttribute("fill", "#F7F0E5");
  });

  it("renders the official FlippedLogo horizontal lockup", () => {
    render(<FlippedLogo height={28} />);
    expect(screen.getByText("FLIPPED")).toBeInTheDocument();
  });

  it("verifies public brand assets exist on disk and follow specifications", () => {
    const publicDir = path.resolve(process.cwd(), "public");

    // Favicons
    expect(fs.existsSync(path.join(publicDir, "favicon.svg"))).toBe(true);
    expect(fs.existsSync(path.join(publicDir, "favicon-16x16.png"))).toBe(true);
    expect(fs.existsSync(path.join(publicDir, "favicon-32x32.png"))).toBe(true);
    expect(fs.existsSync(path.join(publicDir, "favicon-48x48.png"))).toBe(true);
    expect(fs.existsSync(path.join(publicDir, "favicon.ico"))).toBe(true);
    expect(fs.existsSync(path.join(publicDir, "apple-touch-icon.png"))).toBe(true);
    expect(fs.existsSync(path.join(publicDir, "icon-192.png"))).toBe(true);
    expect(fs.existsSync(path.join(publicDir, "icon-512.png"))).toBe(true);

    // SVG vectors
    expect(fs.existsSync(path.join(publicDir, "logo-symbol.svg"))).toBe(true);
    expect(fs.existsSync(path.join(publicDir, "logo.svg"))).toBe(true);

    // Verify SVG favicon content matches brand specifications
    const faviconContent = fs.readFileSync(path.join(publicDir, "favicon.svg"), "utf8");
    expect(faviconContent).toContain("#7B1E2B"); // Crimson background
    expect(faviconContent).toContain("#F7F0E5"); // Warm cream symbol
    expect(faviconContent).toContain("M 0 0 L 64 0 L 48 16 L 16 16 L 16 64 L 0 64 Z"); // Spine & Top bar
    expect(faviconContent).toContain("M 24 24 L 56 24 L 40 40 L 24 40 Z"); // Middle tile
  });

  it("renders the SplashIntro with crimson background and cream FLIPPED wordmark", () => {
    render(<SplashIntro forceShow />);

    const splash = screen.getByTestId("splash-intro");
    expect(splash).toBeInTheDocument();
    expect(splash).toHaveClass("bg-[#7B1E2B]");

    // Brand wordmark
    expect(screen.getByText("FLIPPED")).toHaveClass("text-[#F7F0E5]");
    expect(screen.getByText("Word Deduction Puzzle")).toBeInTheDocument();
  });
});
