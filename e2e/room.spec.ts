import { test, expect } from "@playwright/test";

test.describe("Room Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/room/test-room");
    await page.waitForLoadState("networkidle");
  });

  test("should display room header with room name", async ({ page }) => {
    await expect(page.getByText("test-room")).toBeVisible();
    // Watch Party is in a span, not a heading
    await expect(page.getByText("Watch Party")).toBeVisible();
  });

  test("should show connection status", async ({ page }) => {
    // Should show connecting or connected
    await expect(page.getByText(/Connect/)).toBeVisible();
  });

  test("should have back button that navigates home", async ({ page }) => {
    await page.getByTestId("back-button").click();

    await expect(page).toHaveURL("/");
  });

  test("should have share button", async ({ page }) => {
    await page.getByTestId("share-button").click();

    // Should show "Copied!" text
    await expect(page.getByText("Copied!")).toBeVisible();
  });

  test("should toggle room bookmark", async ({ page }) => {
    const bookmarkButton = page.getByTestId("bookmark-button");

    // Initially not bookmarked
    await expect(bookmarkButton).toContainText("☆");

    // Click to bookmark
    await bookmarkButton.click();

    // Should be bookmarked
    await expect(bookmarkButton).toContainText("★");

    // Click again to unbookmark
    await bookmarkButton.click();

    // Should be unbookmarked
    await expect(bookmarkButton).toContainText("☆");
  });

  test("should open room settings", async ({ page }) => {
    const settingsButton = page.getByTestId("room-settings-button");
    await expect(settingsButton).toBeVisible();
    await settingsButton.click();

    await expect(page.getByTestId("room-settings")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Room Settings")).toBeVisible();
  });

  test("should toggle poll section", async ({ page }) => {
    await page.getByTestId("poll-button").click();

    await expect(page.getByTestId("poll-container")).toBeVisible();
    await expect(page.getByTestId("create-poll-button")).toBeVisible();
  });

  test("should open emoji reactions", async ({ page }) => {
    await page.getByTestId("reaction-button").click();

    await expect(page.getByTestId("emoji-picker")).toBeVisible();
  });
});

test.describe("Room Settings", () => {
  test("should display room info", async ({ page }) => {
    await page.goto("/room/test-room");
    await page.waitForLoadState("networkidle");

    const settingsButton = page.getByTestId("room-settings-button");
    await expect(settingsButton).toBeVisible();
    await settingsButton.click();

    // Wait for room settings modal
    const roomSettings = page.getByTestId("room-settings");
    await expect(roomSettings).toBeVisible({ timeout: 10000 });

    // Check for room ID in the settings
    await expect(roomSettings.getByText("test-room")).toBeVisible();
  });

  test("should toggle private room", async ({ page }) => {
    await page.goto("/room/test-room");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("room-settings-button").click();

    await expect(page.getByTestId("room-settings")).toBeVisible({ timeout: 10000 });

    const privateToggle = page.getByTestId("private-toggle");
    await privateToggle.click();

    // Should show password input
    await expect(page.getByTestId("room-password-input")).toBeVisible();
  });

  test("should adjust room capacity", async ({ page }) => {
    await page.goto("/room/test-room");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("room-settings-button").click();

    await expect(page.getByTestId("room-settings")).toBeVisible({ timeout: 10000 });

    const slider = page.getByTestId("capacity-slider");
    await slider.fill("25");
  });
});

test.describe("Polls", () => {
  test("should create a poll", async ({ page }) => {
    await page.goto("/room/test-room");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("poll-button").click();

    await page.getByTestId("create-poll-button").click();

    // Fill poll form
    await page.getByTestId("poll-question-input").fill("What should we watch?");
    await page.getByTestId("poll-option-input-0").fill("Movie A");
    await page.getByTestId("poll-option-input-1").fill("Movie B");

    await page.getByTestId("submit-poll-button").click();

    // Poll should be visible
    await expect(page.getByText("What should we watch?")).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Emoji Reactions", () => {
  test("should send a reaction", async ({ page }) => {
    await page.goto("/room/test-room");
    await page.waitForLoadState("networkidle");

    await page.getByTestId("reaction-button").click();

    // Click on an emoji
    await page.getByTestId("emoji-😂").click();

    // Floating reaction should appear
    await expect(page.getByTestId("floating-reaction")).toBeVisible();
  });
});

test.describe("Room History Tracking", () => {
  test("should track room visit in history", async ({ page }) => {
    // Visit a room
    await page.goto("/room/history-test-room");
    await page.waitForLoadState("networkidle");

    // Wait for room to load - check for room name in header
    await expect(page.getByText("history-test-room")).toBeVisible();

    // Go back to home
    await page.getByTestId("back-button").click();
    await page.waitForLoadState("networkidle");

    // Open history
    await page.getByTestId("history-button").click();

    // Wait for watch history to be visible
    const watchHistory = page.getByTestId("watch-history");
    await expect(watchHistory).toBeVisible();

    // Go to rooms tab
    await watchHistory.getByRole("button", { name: /Rooms/ }).click();

    // Room should be in history - scope to watch history modal
    await expect(watchHistory.getByText("history-test-room")).toBeVisible({ timeout: 10000 });
  });

  test("should save room bookmark and show on home", async ({ page }) => {
    // Visit a room
    await page.goto("/room/bookmark-test-room");
    await page.waitForLoadState("networkidle");

    // Wait for room to load
    await expect(page.getByText("bookmark-test-room")).toBeVisible();

    // Bookmark the room
    await page.getByTestId("bookmark-button").click();

    // Go back to home
    await page.getByTestId("back-button").click();
    await page.waitForLoadState("networkidle");

    // Open bookmarks
    await page.getByTestId("bookmarks-button").click();

    // Room should be in bookmarks - scope to room bookmarks modal
    const bookmarksModal = page.getByTestId("room-bookmarks");
    await expect(bookmarksModal).toBeVisible();
    await expect(bookmarksModal.getByText("bookmark-test-room")).toBeVisible({ timeout: 10000 });
  });
});
