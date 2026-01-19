import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for page to be fully loaded
    await page.waitForLoadState("networkidle");
  });

  test("should display the homepage with branding", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Watch Party", exact: true })).toBeVisible();
    await expect(page.getByText("Watch YouTube videos together")).toBeVisible();
  });

  test("should have username and room name inputs", async ({ page }) => {
    await expect(page.getByTestId("username-input")).toBeVisible();
    await expect(page.getByTestId("room-name-input")).toBeVisible();
  });

  test("should create a room when form is submitted", async ({ page }) => {
    await page.getByTestId("room-name-input").fill("test-room");
    await page.getByTestId("create-room-button").click();

    await expect(page).toHaveURL(/\/room\/test-room/);
  });

  test("should create a random room", async ({ page }) => {
    await page.getByTestId("random-room-button").click();

    await expect(page).toHaveURL(/\/room\/.+/);
  });

  test("should open sign in modal", async ({ page }) => {
    await page.getByTestId("sign-in-button").click();

    await expect(page.getByTestId("auth-modal")).toBeVisible();
    await expect(page.getByText("Welcome Back")).toBeVisible();
  });

  test("should open theme settings", async ({ page }) => {
    const themeButton = page.getByTestId("theme-button");
    await expect(themeButton).toBeVisible();
    await themeButton.click();

    // Wait for the modal to appear with longer timeout
    await expect(page.getByTestId("theme-settings")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Settings")).toBeVisible();
  });

  test("should open scheduled parties panel", async ({ page }) => {
    await page.getByTestId("scheduled-button").click();

    await expect(page.getByTestId("scheduled-parties")).toBeVisible();
  });

  test("should open friends panel", async ({ page }) => {
    await page.getByTestId("friends-button").click();

    await expect(page.getByTestId("friends-panel")).toBeVisible();
  });

  test("should open watch history", async ({ page }) => {
    await page.getByTestId("history-button").click();

    await expect(page.getByTestId("watch-history")).toBeVisible();
  });

  test("should open bookmarks/saved panel", async ({ page }) => {
    await page.getByTestId("bookmarks-button").click();

    await expect(page.getByTestId("room-bookmarks")).toBeVisible();
  });
});

test.describe("Authentication", () => {
  test("should register a new user", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("sign-in-button").click();

    // Wait for modal to be visible
    await expect(page.getByTestId("auth-modal")).toBeVisible();

    // Switch to register mode
    await page.getByRole("button", { name: "Sign Up" }).click();

    // Fill registration form - scope inputs to auth modal
    const authModal = page.getByTestId("auth-modal");
    await authModal.getByTestId("username-input").fill("testuser");
    await authModal.getByTestId("email-input").fill("test@example.com");
    await authModal.getByTestId("password-input").fill("password123");

    await authModal.getByTestId("auth-submit").click();

    // Modal should close and profile button should appear
    await expect(page.getByTestId("auth-modal")).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("profile-button")).toBeVisible();
  });

  test("should show error for invalid login", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("sign-in-button").click();

    const authModal = page.getByTestId("auth-modal");
    await expect(authModal).toBeVisible();

    await authModal.getByTestId("email-input").fill("nonexistent@example.com");
    await authModal.getByTestId("password-input").fill("wrongpassword");

    await authModal.getByTestId("auth-submit").click();

    await expect(authModal.getByTestId("auth-error")).toBeVisible();
  });
});

test.describe("Theme Settings", () => {
  test("should switch theme modes", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("theme-button").click();

    await expect(page.getByTestId("theme-settings")).toBeVisible({ timeout: 10000 });

    // Test light mode
    await page.getByTestId("theme-light").click();

    // Test dark mode
    await page.getByTestId("theme-dark").click();

    // Test system mode
    await page.getByTestId("theme-system").click();
  });

  test("should toggle sound effects", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("theme-button").click();

    await expect(page.getByTestId("theme-settings")).toBeVisible({ timeout: 10000 });
    await page.getByTestId("sound-toggle").click();
  });
});

test.describe("Scheduled Parties", () => {
  test("should open scheduled parties panel and form", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("scheduled-button").click();

    await expect(page.getByTestId("scheduled-parties")).toBeVisible();
    await page.getByTestId("create-party-button").click();

    // Wait for form to appear
    await expect(page.getByTestId("party-name-input")).toBeVisible();
    await expect(page.getByTestId("party-datetime-input")).toBeVisible();
    await expect(page.getByTestId("submit-party-button")).toBeVisible();
  });
});

test.describe("Friends", () => {
  test("should search for users", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("friends-button").click();

    // Go to search tab - scope to friends panel
    const friendsPanel = page.getByTestId("friends-panel");
    await expect(friendsPanel).toBeVisible();

    await friendsPanel.getByRole("button", { name: "Search" }).click();

    await friendsPanel.getByTestId("friend-search-input").fill("Movie");

    // Should show search results
    await expect(friendsPanel.getByText("MovieLover42")).toBeVisible({ timeout: 10000 });
  });

  test("should have add friend button in search results", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("friends-button").click();

    // Go to search tab
    const friendsPanel = page.getByTestId("friends-panel");
    await expect(friendsPanel).toBeVisible();

    await friendsPanel.getByRole("button", { name: "Search" }).click();

    await friendsPanel.getByTestId("friend-search-input").fill("Movie");

    // Wait for search results
    await expect(friendsPanel.getByText("MovieLover42")).toBeVisible({ timeout: 10000 });

    // Add friend button should be visible
    await expect(friendsPanel.getByTestId("add-user-1")).toBeVisible();
  });
});
