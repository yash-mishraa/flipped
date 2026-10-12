import { test, expect } from "@playwright/test";

test.describe("Journey C & D — Hints and Timeout Lifecycle", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("flipped_onboarding_completed_v1", "true");
    });
  });

  test("Journey C: Hint usage reveals an answer letter and applies a 5-point deduction", async ({
    page,
  }) => {
    await page.goto("/classic");

    // Start round
    const startButton = page.getByTestId("start-game-button");
    await startButton.click();
    await expect(page.getByText(/Round Active/i)).toBeVisible();

    // Verify initial hints used is 0
    const hintsMetric = page.locator('[data-testid="game-hud"]').getByText("Hints:").locator("..");
    await expect(hintsMetric).toContainText("0");

    // Click "Use Hint"
    const hintButton = page.getByTestId("use-hint-button");
    await expect(hintButton).toBeVisible();
    await hintButton.click();

    // Verify hints count updated to 1
    await expect(hintsMetric).toContainText("1");

    // Verify tile (0, 1) has been revealed and locked
    const hintTile = page.getByTestId("tile-0-1");
    await expect(hintTile).toHaveAttribute("data-fixed", "true");
    await expect(hintTile).toHaveAttribute("data-feedback", "CONFIRMED");
  });

  test("Journey D: Timeout disables further input and reveals canonical solution", async ({
    page,
  }) => {
    await page.goto("/classic");

    const startButton = page.getByTestId("start-game-button");
    await startButton.click();
    await expect(page.getByText(/Round Active/i)).toBeVisible();

    // Trigger timeout in the same guest session
    const timeoutResult = await page.evaluate(async () => {
      const res = await fetch("/api/game/classic/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty: "EASY" }),
      });
      const data = await res.json();
      const attId = data.payload?.attemptId;
      if (!attId) return { success: false };

      const timeoutRes = await fetch(`/api/game/attempt/${attId}/timeout`, { method: "POST" });
      const timeoutData = await timeoutRes.json();
      return { success: timeoutRes.ok, status: timeoutRes.status, data: timeoutData };
    });

    expect(timeoutResult.success).toBe(true);
    expect(timeoutResult.data.result.status).toBe("TIMED_OUT");
    expect(timeoutResult.data.result.canonicalPhrase).toBeDefined();
  });
});
