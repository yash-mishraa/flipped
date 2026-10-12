import { test, expect } from "@playwright/test";

test.describe("Shell Smoke Test", () => {
  test("loads the landing page with game title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Flipped/);
    await expect(page.getByRole("heading", { name: "Flipped", level: 1 })).toBeVisible();
  });
});
