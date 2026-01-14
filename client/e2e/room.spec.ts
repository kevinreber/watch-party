import { test, expect } from "@playwright/test";

test.describe("Room Page", () => {
  test("should load the room page", async ({ page }) => {
    await page.goto("/room/test-room");
    await expect(page).toHaveURL("/room/test-room");
  });

  test("should display content on the page", async ({ page }) => {
    await page.goto("/room/test-room");
    await page.waitForLoadState("domcontentloaded");

    // Wait for body to have content
    const body = page.locator("body");
    await expect(body).not.toBeEmpty();
  });
});
