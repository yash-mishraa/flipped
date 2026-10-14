import confetti from "canvas-confetti";

/**
 * Fires a festive, multi-burst confetti animation styled with the Flipped color palette.
 * Respects prefers-reduced-motion accessibility preferences.
 */
export function triggerVictoryConfetti(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  // Verify canvas and 2d context are available (avoids errors in jsdom/testing environments)
  try {
    const testCanvas = document.createElement("canvas");
    if (!testCanvas || typeof testCanvas.getContext !== "function" || !testCanvas.getContext("2d")) {
      return;
    }
  } catch {
    return;
  }

  // Respect user preference for reduced motion
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const count = 160;
  const defaults = {
    origin: { y: 0.65 },
    zIndex: 99999,
  };

  const fire = (particleRatio: number, opts: confetti.Options) => {
    try {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    } catch {
      // Gracefully ignore in non-canvas or testing environments
    }
  };

  // Multi-stage celebratory bursts with signature crimson (#7B1E2B), gold/sand (#C49A6C), and cream (#F7F0E5)
  fire(0.25, {
    spread: 32,
    startVelocity: 55,
    colors: ["#7B1E2B", "#C49A6C", "#F7F0E5"],
  });

  fire(0.2, {
    spread: 60,
    colors: ["#7B1E2B", "#FFB703", "#faeee0"],
  });

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.85,
    colors: ["#7B1E2B", "#C49A6C", "#32171D"],
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
    colors: ["#C49A6C", "#F7F0E5", "#FB8500"],
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
    colors: ["#7B1E2B", "#C49A6C"],
  });
}
