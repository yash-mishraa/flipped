import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import NotFound from "@/app/not-found";
import ErrorPage from "@/app/error";
import GlobalError from "@/app/global-error";
import Loading from "@/app/loading";
import nextConfig from "../../../next.config";

// Mock Clerk auth
vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ isSignedIn: false, user: null }),
  Show: ({ when, children }: { when: string; children: React.ReactNode }) =>
    when === "signed-out" ? <>{children}</> : null,
  UserButton: () => null,
}));

describe("App Fallbacks, Error Boundaries & Redirections", () => {
  it("renders NotFound (404) page with navigation routes and return home button", () => {
    render(<NotFound />);

    expect(screen.getByTestId("not-found-page")).toBeInTheDocument();
    expect(screen.getByText("404 • Page Not Found")).toBeInTheDocument();
    expect(screen.getByText("Phrase Unflipped")).toBeInTheDocument();
    expect(screen.getAllByText("Daily Challenge").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Classic Mode").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Past Archives").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Return Home" })).toBeInTheDocument();
  });

  it("renders ErrorPage with error message, digest, and handles reset() call", () => {
    const handleReset = vi.fn();
    const testError = Object.assign(new Error("Database connection dropped"), {
      digest: "ERR_12345",
    });

    render(<ErrorPage error={testError} reset={handleReset} />);

    expect(screen.getByText("Something Flipped Wrong")).toBeInTheDocument();
    expect(screen.getByText("Unexpected Puzzle Hitch")).toBeInTheDocument();
    expect(screen.getByText(/Error Digest: ERR_12345/)).toBeInTheDocument();

    const tryAgainBtn = screen.getByRole("button", { name: /Try Again/i });
    expect(tryAgainBtn).toBeInTheDocument();
    fireEvent.click(tryAgainBtn);
    expect(handleReset).toHaveBeenCalledTimes(1);

    expect(screen.getByRole("link", { name: /Return Home/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Report this issue/i })).toBeInTheDocument();
  });

  it("renders GlobalError for root layout failures and supports retry", () => {
    const handleReset = vi.fn();
    const testError = new Error("Root layout hydration failure");

    render(<GlobalError error={testError} reset={handleReset} />);

    expect(screen.getByText("Critical System Glitch")).toBeInTheDocument();
    const tryAgainBtn = screen.getByRole("button", { name: /Try Again/i });
    fireEvent.click(tryAgainBtn);
    expect(handleReset).toHaveBeenCalledTimes(1);
  });

  it("renders Loading screen during route transitions with pulsing emblem", () => {
    render(<Loading />);

    expect(screen.getByTestId("app-loading")).toBeInTheDocument();
    expect(screen.getByText("Loading FLIPPED")).toBeInTheDocument();
    expect(screen.getByText(/Shuffling clues and setting up puzzle/i)).toBeInTheDocument();
  });

  it("configures canonical redirects and security headers in next.config.ts", async () => {
    if (typeof nextConfig.redirects === "function") {
      const redirects = await nextConfig.redirects();
      const sources = redirects.map((r: { source: string }) => r.source);
      expect(sources).toContain("/play");
      expect(sources).toContain("/game");
      expect(sources).toContain("/rules");
      expect(sources).toContain("/how-to-play");
      expect(sources).toContain("/leaderboard");
      expect(sources).toContain("/feedback");
      expect(sources).toContain("/support");
      expect(sources).toContain("/help");
      expect(sources).toContain("/legal");
    }

    if (typeof nextConfig.headers === "function") {
      const headerRules = await nextConfig.headers();
      expect(headerRules.length).toBeGreaterThan(0);
      const securityHeaders = headerRules[0]?.headers.map((h: { key: string }) => h.key);
      expect(securityHeaders).toContain("X-Frame-Options");
      expect(securityHeaders).toContain("X-Content-Type-Options");
      expect(securityHeaders).toContain("Referrer-Policy");
    }
  });
});
