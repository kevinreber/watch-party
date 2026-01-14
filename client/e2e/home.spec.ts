import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load the homepage", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/");
  });

  test("should display content on the page", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Wait for body to have content
    const body = page.locator("body");
    await expect(body).not.toBeEmpty();
  });
});
