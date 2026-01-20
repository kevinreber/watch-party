/**
 * Playwright fixtures for Convex testing
 *
 * These fixtures handle seeding and clearing test data in Convex
 * before and after test runs.
 */
import { test as base, expect } from "@playwright/test";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

// Get Convex URL from environment or use default dev URL
const CONVEX_URL = process.env.VITE_CONVEX_URL || "http://localhost:3210";

// Create a Convex HTTP client for test setup/teardown
const convex = new ConvexHttpClient(CONVEX_URL);

/**
 * Extended test fixtures with Convex utilities
 */
export const test = base.extend<{
  seedTestData: () => Promise<void>;
  clearTestData: () => Promise<void>;
  convexClient: ConvexHttpClient;
}>({
  // Provide Convex client to tests
  convexClient: async ({}, use) => {
    await use(convex);
  },

  // Seed test data before test
  seedTestData: async ({}, use) => {
    const seed = async () => {
      try {
        // Seed in order: users -> rooms -> other data
        await convex.mutation(api.testing.seedTestUsers, {});
        await convex.mutation(api.testing.seedTestRooms, {});
        await convex.mutation(api.testing.seedTestFriendData, {});
      } catch (error) {
        console.error("Failed to seed test data:", error);
        throw error;
      }
    };
    await use(seed);
  },

  // Clear test data after test
  clearTestData: async ({}, use) => {
    const clear = async () => {
      try {
        await convex.mutation(api.testing.clearTestData, {});
      } catch (error) {
        console.error("Failed to clear test data:", error);
        // Don't throw - we don't want cleanup failures to fail tests
      }
    };
    await use(clear);
  },
});

export { expect };

/**
 * Test utilities for common Convex operations
 */
export const convexTestUtils = {
  /**
   * Seed messages in a test room
   */
  async seedMessages(roomName: string) {
    await convex.mutation(api.testing.seedTestMessages, { roomName });
  },

  /**
   * Seed a poll in a test room
   */
  async seedPoll(roomName: string) {
    await convex.mutation(api.testing.seedTestPolls, { roomName });
  },

  /**
   * Seed a scheduled party
   */
  async seedScheduledParty() {
    await convex.mutation(api.testing.seedTestScheduledParty, {});
  },

  /**
   * Check if test data is already seeded
   */
  async isSeeded(): Promise<boolean> {
    const status = await convex.query(api.testing.getTestDataStatus, {});
    return status.isSeeded || false;
  },

  /**
   * Get current test data status
   */
  async getStatus() {
    return convex.query(api.testing.getTestDataStatus, {});
  },
};

/**
 * Global setup - seed data once before all tests
 */
export async function globalSetup() {
  console.log("🌱 Seeding Convex test data...");
  try {
    await convex.mutation(api.testing.seedTestUsers, {});
    await convex.mutation(api.testing.seedTestRooms, {});
    await convex.mutation(api.testing.seedTestFriendData, {});
    console.log("✅ Test data seeded successfully");
  } catch (error) {
    console.error("❌ Failed to seed test data:", error);
    throw error;
  }
}

/**
 * Global teardown - clear data after all tests
 */
export async function globalTeardown() {
  console.log("🧹 Cleaning up Convex test data...");
  try {
    await convex.mutation(api.testing.clearTestData, {});
    console.log("✅ Test data cleared successfully");
  } catch (error) {
    console.error("⚠️ Failed to clear test data:", error);
    // Don't throw - cleanup failures shouldn't fail the test run
  }
}
