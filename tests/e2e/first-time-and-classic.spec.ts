import { test, expect } from "@playwright/test";

test.describe("Journey A & B — First-Time Player & Classic Mode", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to simulate fresh visitor
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("Journey A: Player reviews How to Play rules, navigates to Classic, and plays a round", async ({
    page,
  }) => {
    await page.goto("/");

    // 1. Verify How to Play button is visible and works
    const howToPlayButton = page.getByRole("button", { name: /How to Play/i }).first();
    await expect(howToPlayButton).toBeVisible();
    await howToPlayButton.click();
    await expect(page.getByRole("heading", { name: "How Flipped Works", level: 2 })).toBeVisible();

    // Close tutorial dialog so page links become clickable
    await page.getByRole("button", { name: /Close tutorial dialog/i }).click();

    // 2. Navigate to Classic Mode via top navigation
    const classicLink = page.getByRole("link", { name: /Classic/i }).first();
    await classicLink.click();
    await expect(page).toHaveURL(/\/classic/);

    // 4. Select Easy difficulty using testid
    const easyPill = page.getByTestId("difficulty-easy");
    await expect(easyPill).toBeVisible();
    await easyPill.click();

    // 5. Start round
    const startButton = page.getByTestId("start-game-button");
    await expect(startButton).toBeVisible();
    await startButton.click();

    // 6. Verify round status is active
    await expect(page.getByText(/Round Active/i)).toBeVisible();

    // Verify first letter of each word is fixed (non-editable)
    const fixedTile0 = page.getByTestId("tile-0-0");
    await expect(fixedTile0).toHaveAttribute("data-fixed", "true");
    const fixedTile1 = page.getByTestId("tile-1-0");
    await expect(fixedTile1).toHaveAttribute("data-fixed", "true");

    // 7. Click next puzzle to verify cycle works
    const restartButton = page.getByRole("button", { name: /New Puzzle/i });
    if (await restartButton.isVisible()) {
      await restartButton.click();
      await expect(page.getByTestId("start-game-button")).toBeVisible();
    }
  });

  test("Journey B: Letter entry, editing, and backspace correction without submit button", async ({
    page,
  }) => {
    // Mark onboarding as completed so modal doesn't pop up
    await page.addInitScript(() => {
      localStorage.setItem("flipped_onboarding_completed_v1", "true");
    });

    await page.goto("/classic");

    // Start round
    const startButton = page.getByTestId("start-game-button");
    await expect(startButton).toBeVisible();
    await startButton.click();

    // Focus tile (0, 1) and enter wrong letter "Z"
    const tile01 = page.getByTestId("tile-0-1");
    await tile01.click();
    await page.keyboard.press("Z");
    await expect(tile01).toContainText("Z");

    // Select tile01 directly and erase with Backspace
    await tile01.click();
    await page.keyboard.press("Backspace");
    await expect(tile01).not.toContainText("Z");

    // Type letter "X"
    await page.keyboard.press("X");
    await expect(tile01).toContainText("X");

    // Replace it directly by selecting and typing "A"
    await tile01.click();
    await page.keyboard.press("A");
    await expect(tile01).toContainText("A");
  });
});
