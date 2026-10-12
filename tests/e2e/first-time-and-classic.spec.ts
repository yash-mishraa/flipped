import { test, expect } from "@playwright/test";

test.describe("Journey A & B — First-Time Player & Classic Mode", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to simulate fresh visitor
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("Journey A: First-time player sees tutorial, skips to Classic, and plays a round", async ({
    page,
  }) => {
    await page.goto("/");

    // 1. First-time visitor sees TutorialModal
    const tutorialDialog = page.getByRole("dialog", { name: /How to Play Flipped/i });
    await expect(tutorialDialog).toBeVisible();

    // 2. Skip or complete tutorial
    const skipButton = page.getByRole("button", { name: /Skip Tutorial/i });
    await skipButton.click();
    await expect(tutorialDialog).not.toBeVisible();

    // 3. Navigate to Classic Mode
    const classicLink = page.getByRole("link", { name: /Classic Practice/i }).first();
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
