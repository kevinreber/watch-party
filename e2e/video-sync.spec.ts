import { test, expect, type BrowserContext, type Page } from "@playwright/test";

/**
 * Video Sync E2E Tests
 *
 * These tests verify that video synchronization works correctly,
 * particularly for late joiners who join a room where a video is already playing.
 */

test.describe("Video Sync - Late Joiner", () => {
  let context1: BrowserContext;
  let context2: BrowserContext;
  let page1: Page;
  let page2: Page;

  // Use a unique room name for each test run to avoid conflicts
  const roomName = `sync-test-${Date.now()}`;

  test.beforeAll(async ({ browser }) => {
    // Create two separate browser contexts (simulating two different users)
    context1 = await browser.newContext();
    context2 = await browser.newContext();
    page1 = await context1.newPage();
    page2 = await context2.newPage();
  });

  test.afterAll(async () => {
    await context1?.close();
    await context2?.close();
  });

  test("late joiner should see video that first user added", async () => {
    // User 1 joins the room
    await page1.goto(`/room/${roomName}`);
    await page1.waitForLoadState("networkidle");

    // Wait for the room to load
    await expect(page1.getByText(roomName)).toBeVisible();
    await expect(page1.getByText("Watch Party")).toBeVisible();

    // User 1 adds a video (using a known YouTube video URL)
    const videoUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    const searchInput = page1.getByPlaceholder(/search.*youtube|paste.*url/i);
    await searchInput.fill(videoUrl);

    // Click the Add button
    const addButton = page1.getByRole("button", { name: /add/i });
    await addButton.click();

    // Wait for video to be added - check for "Now Playing" section
    await expect(page1.getByText("Now Playing")).toBeVisible({ timeout: 15000 });

    // User 2 joins the same room AFTER the video is added
    await page2.goto(`/room/${roomName}`);
    await page2.waitForLoadState("networkidle");

    // Wait for room to load for User 2
    await expect(page2.getByText(roomName)).toBeVisible();

    // CRITICAL ASSERTION: User 2 should see the video (not "No video playing")
    // This is the main bug we're fixing - late joiners should see the current video
    await expect(page2.getByText("Now Playing")).toBeVisible({ timeout: 15000 });

    // Should NOT see the empty state
    await expect(page2.getByText("No video playing")).not.toBeVisible();
  });

  test("late joiner should see synced playback indicator", async () => {
    const syncRoomName = `sync-indicator-test-${Date.now()}`;

    // User 1 joins and adds a video
    await page1.goto(`/room/${syncRoomName}`);
    await page1.waitForLoadState("networkidle");

    const videoUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    const searchInput = page1.getByPlaceholder(/search.*youtube|paste.*url/i);
    await searchInput.fill(videoUrl);
    await page1.getByRole("button", { name: /add/i }).click();

    // Wait for video to load
    await expect(page1.getByText("Now Playing")).toBeVisible({ timeout: 15000 });

    // User 2 joins
    await page2.goto(`/room/${syncRoomName}`);
    await page2.waitForLoadState("networkidle");

    // User 2 should see the sync indicator
    await expect(page2.getByText("Synced")).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Video Sync - Queue Visibility", () => {
  let context1: BrowserContext;
  let context2: BrowserContext;
  let page1: Page;
  let page2: Page;

  test.beforeAll(async ({ browser }) => {
    context1 = await browser.newContext();
    context2 = await browser.newContext();
    page1 = await context1.newPage();
    page2 = await context2.newPage();
  });

  test.afterAll(async () => {
    await context1?.close();
    await context2?.close();
  });

  test("late joiner should see video queue", async () => {
    const queueRoomName = `queue-test-${Date.now()}`;

    // User 1 joins and adds multiple videos
    await page1.goto(`/room/${queueRoomName}`);
    await page1.waitForLoadState("networkidle");

    // Add first video
    const searchInput = page1.getByPlaceholder(/search.*youtube|paste.*url/i);
    await searchInput.fill("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    await page1.getByRole("button", { name: /add/i }).click();

    // Wait for first video
    await expect(page1.getByText("Now Playing")).toBeVisible({ timeout: 15000 });

    // Add second video to queue
    await searchInput.fill("https://www.youtube.com/watch?v=9bZkp7q19f0");
    await page1.getByRole("button", { name: /add/i }).click();

    // Wait for queue to show second video - look for queue badge or count
    await expect(page1.getByText(/queue/i)).toBeVisible({ timeout: 10000 });

    // User 2 joins late
    await page2.goto(`/room/${queueRoomName}`);
    await page2.waitForLoadState("networkidle");

    // User 2 should see the queue tab/section
    await expect(page2.getByText(/queue/i)).toBeVisible({ timeout: 15000 });

    // User 2 should see the current video
    await expect(page2.getByText("Now Playing")).toBeVisible();
  });
});

test.describe("Video Sync - Sync Button", () => {
  test("sync button should be visible in room", async ({ page }) => {
    const roomName = `sync-btn-visible-${Date.now()}`;
    await page.goto(`/room/${roomName}`);
    await page.waitForLoadState("networkidle");

    // The sync button should be present in the room header
    await expect(page.getByTestId("sync-button")).toBeVisible();
    await expect(page.getByTestId("sync-button")).toHaveText(/sync/i);
  });

  test("sync button should re-sync video state for late joiner", async ({ browser }) => {
    const roomName = `sync-btn-resync-${Date.now()}`;

    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // User 1 joins and adds a video
      await page1.goto(`/room/${roomName}`);
      await page1.waitForLoadState("networkidle");

      const videoUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
      const searchInput = page1.getByPlaceholder(/search.*youtube|paste.*url/i);
      await searchInput.fill(videoUrl);
      await page1.getByRole("button", { name: /add/i }).click();
      await expect(page1.getByText("Now Playing")).toBeVisible({ timeout: 15000 });

      // User 2 joins the room
      await page2.goto(`/room/${roomName}`);
      await page2.waitForLoadState("networkidle");

      // User 2 clicks sync button to force re-sync from server state
      await page2.getByTestId("sync-button").click();

      // After sync, user 2 should see the video
      await expect(page2.getByText("Now Playing")).toBeVisible({ timeout: 15000 });
      await expect(page2.getByText("No video playing")).not.toBeVisible();
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test("sync button should not break existing video playback", async ({ page }) => {
    const roomName = `sync-btn-stable-${Date.now()}`;

    await page.goto(`/room/${roomName}`);
    await page.waitForLoadState("networkidle");

    // Add a video
    const searchInput = page.getByPlaceholder(/search.*youtube|paste.*url/i);
    await searchInput.fill("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    await page.getByRole("button", { name: /add/i }).click();
    await expect(page.getByText("Now Playing")).toBeVisible({ timeout: 15000 });

    // Click sync button multiple times - should not disrupt the player
    await page.getByTestId("sync-button").click();
    await page.waitForTimeout(500);
    await page.getByTestId("sync-button").click();

    // Video should still be visible after syncing
    await expect(page.getByText("Now Playing")).toBeVisible();
    await expect(page.getByText("No video playing")).not.toBeVisible();
  });
});

test.describe("Video Sync - Convex Persisted Room", () => {
  /**
   * This test uses a seeded room that exists in the Convex database.
   * When User 1 adds a video, it persists to Convex via mutations (the fix).
   * When User 2 joins, the Convex query returns the video state directly.
   *
   * This tests the core fix: video state is now persisted to Convex,
   * not just broadcast via Ably / stored in ephemeral in-memory API.
   *
   * Requires: Convex test data seeded (global-setup.ts)
   */
  test("late joiner sees video in Convex-persisted room", async ({ browser }) => {
    // Use the seeded 'movie-night' room which exists in the Convex DB
    const roomName = "movie-night";

    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // User 1 joins the persisted room
      await page1.goto(`/room/${roomName}`);
      await page1.waitForLoadState("networkidle");

      // User 1 adds a video - this triggers Convex mutations since roomData.id is available
      const videoUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
      const searchInput = page1.getByPlaceholder(/search.*youtube|paste.*url/i);
      await searchInput.fill(videoUrl);
      await page1.getByRole("button", { name: /add/i }).click();
      await expect(page1.getByText("Now Playing")).toBeVisible({ timeout: 15000 });

      // Allow time for Convex mutation to persist
      await page1.waitForTimeout(2000);

      // User 2 joins the same persisted room
      // The Convex query (getRoomBySlug) should return currentVideo from the database
      await page2.goto(`/room/${roomName}`);
      await page2.waitForLoadState("networkidle");

      // CRITICAL: User 2 should see the video loaded from Convex (not ephemeral state)
      await expect(page2.getByText("Now Playing")).toBeVisible({ timeout: 15000 });
      await expect(page2.getByText("No video playing")).not.toBeVisible();

      // User 2 should also see the synced indicator
      await expect(page2.getByText("Synced")).toBeVisible({ timeout: 10000 });
    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test("late joiner can use sync button in Convex-persisted room", async ({ browser }) => {
    // Use the seeded 'test-room' which exists in the Convex DB
    const roomName = "test-room";

    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // User 1 adds a video to the persisted room
      await page1.goto(`/room/${roomName}`);
      await page1.waitForLoadState("networkidle");

      const videoUrl = "https://www.youtube.com/watch?v=9bZkp7q19f0";
      const searchInput = page1.getByPlaceholder(/search.*youtube|paste.*url/i);
      await searchInput.fill(videoUrl);
      await page1.getByRole("button", { name: /add/i }).click();
      await expect(page1.getByText("Now Playing")).toBeVisible({ timeout: 15000 });

      // Allow Convex mutation to persist
      await page1.waitForTimeout(2000);

      // User 2 joins
      await page2.goto(`/room/${roomName}`);
      await page2.waitForLoadState("networkidle");

      // User 2 clicks sync to force-sync from Convex state
      await page2.getByTestId("sync-button").click();

      // Video should be visible after sync
      await expect(page2.getByText("Now Playing")).toBeVisible({ timeout: 15000 });
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});

test.describe("Video Sync - Single User", () => {
  test("user should see video after adding it", async ({ page }) => {
    const singleRoomName = `single-user-${Date.now()}`;

    await page.goto(`/room/${singleRoomName}`);
    await page.waitForLoadState("networkidle");

    // Initially should show empty state
    await expect(page.getByText("No video playing")).toBeVisible();

    // Add a video
    const searchInput = page.getByPlaceholder(/search.*youtube|paste.*url/i);
    await searchInput.fill("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    await page.getByRole("button", { name: /add/i }).click();

    // Should now show the video
    await expect(page.getByText("Now Playing")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("No video playing")).not.toBeVisible();
  });

  test("empty room should show no video playing state", async ({ page }) => {
    const emptyRoomName = `empty-room-${Date.now()}`;

    await page.goto(`/room/${emptyRoomName}`);
    await page.waitForLoadState("networkidle");

    // Should show empty state
    await expect(page.getByText("No video playing")).toBeVisible({ timeout: 10000 });
  });
});
