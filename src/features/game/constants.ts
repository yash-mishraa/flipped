import type { ModeDescription } from "@/types";

export const APP_CONFIG = {
  name: "Flipped",
  tagline: "The tactile word puzzle where letters shift, flip, and click into place.",
  version: "0.1.0",
} as const;

export const GAME_MODES: readonly ModeDescription[] = [
  {
    mode: "daily",
    title: "Daily Puzzle",
    badge: "Synchronized",
    description:
      "A universal challenge refreshed every 24 hours. Solve with equal constraints to build and protect your daily streak.",
    features: [
      "Shared puzzle across all players",
      "One attempt per calendar day",
      "Automatic answer validation",
    ],
  },
  {
    mode: "classic",
    title: "Classic Mode",
    badge: "Unlimited",
    description:
      "Play on-demand puzzles at your own pace. Practice strategies and explore different word lengths and difficulties.",
    features: [
      "Endless puzzle generator",
      "Selectable difficulty tiers",
      "Instant feedback and replay",
    ],
  },
] as const;
