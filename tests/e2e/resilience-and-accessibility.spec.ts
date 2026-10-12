import { test, expect } from "@playwright/test";

test.describe("Journey F — Responsive Viewports, Accessibility & Resilience", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("flipped_onboarding_completed_v1", "true");
    });
  });

  const viewports = [
    { name: "Small Mobile (320px)", width: 320, height: 600 },
    { name: "Standard Mobile (390px)", width: 390, height: 844 },
    { name: "Tablet (768px)", width: 768, height: 1024 },
    { name: "Desktop (1280px)", width: 1280, height: 800 },
  ];

  for (const vp of viewports) {
    test(`renders without horizontal overflow at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");

      // Assert no horizontal scrollbar / overflow
      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(isOverflowing).toBe(false);

      // Verify Header brand is visible
      await expect(page.getByRole("banner")).toBeVisible();

      // Check Classic page at this viewport
      await page.goto("/classic");
      const classicOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(classicOverflow).toBe(false);
    });
  }

  test("Keyboard navigation traverses interactive tiles and controls", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/classic");

    // Start round
    const startButton = page.getByTestId("start-game-button");
    await startButton.click();

    // Select tile 0-1
    const tile01 = page.getByTestId("tile-0-1");
    await tile01.click();
    await expect(tile01).toHaveAttribute("data-selected", "true");

    // Use ArrowRight to navigate to next editable tile
    await page.keyboard.press("ArrowRight");
    const tile02 = page.getByTestId("tile-0-2");
    await expect(tile02).toHaveAttribute("data-selected", "true");
  });

  test("Header navigation routes between pages seamlessly", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    // Click Statistics in header nav
    const statsLink = page.locator('header a[href="/stats"]').first();
    await statsLink.click();
    await expect(page).toHaveURL(/\/stats/);
    await expect(page.getByRole("heading", { name: /Player Statistics/i })).toBeVisible();

    // Click Archive in header nav
    const archiveLink = page.locator('header a[href="/archive"]').first();
    await archiveLink.click();
    await expect(page).toHaveURL(/\/archive/);
    await expect(page.getByRole("heading", { name: /Challenge Archive/i })).toBeVisible();
  });
});
