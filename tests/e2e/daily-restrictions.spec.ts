import { test, expect } from "@playwright/test";

test.describe("Journey E — Daily Challenge Restrictions & Persistence", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("flipped_onboarding_completed_v1", "true");
    });
  });

  test("Journey E: Daily challenge single-attempt enforcement and reload persistence", async ({
    page,
  }) => {
    // 1. Visit /daily
    await page.goto("/daily");

    // Wait for initial load spinner to disappear
    await expect(page.getByText(/Loading Today/i)).not.toBeVisible({ timeout: 15000 });

    const startButton = page.getByTestId("start-game-button");
    const completionCard = page.getByTestId("daily-completion-card");

    if (await completionCard.isVisible()) {
      // Already completed; verify read-only completion card is displayed
      await expect(completionCard).toBeVisible();
    } else {
      // Unplayed; start round
      await expect(startButton).toBeVisible();
      await startButton.click();
      await expect(page.getByText(/Round Active/i)).toBeVisible();

      // Seal attempt as completed in the same guest session
      await page.evaluate(async () => {
        const statusRes = await fetch("/api/game/daily/status");
        const statusData = await statusRes.json();
        if (statusData.attemptId) {
          await fetch(`/api/game/attempt/${statusData.attemptId}/timeout`, { method: "POST" });
        }
      });

      // Reload page and verify completion card renders
      await page.reload();
      await expect(page.getByText(/Loading Today/i)).not.toBeVisible({ timeout: 15000 });
      await expect(page.getByTestId("daily-completion-card")).toBeVisible({ timeout: 10000 });
    }

    // Navigate to Home and back to /daily
    await page.goto("/");
    await expect(page).toHaveURL("/");

    await page.goto("/daily");
    await expect(page.getByText(/Loading Today/i)).not.toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("daily-completion-card")).toBeVisible({ timeout: 10000 });
  });
});
