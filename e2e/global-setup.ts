/**
 * Playwright global setup
 *
 * Runs once before all tests to seed Convex with test data.
 */
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

async function globalSetup() {
  const convexUrl = process.env.VITE_CONVEX_URL;

  if (!convexUrl) {
    console.log("⚠️ VITE_CONVEX_URL not set, skipping Convex test data seeding");
    console.log("   Tests will run with existing data or localStorage mock");
    return;
  }

  console.log("🌱 Seeding Convex test data...");
  console.log(`   Convex URL: ${convexUrl}`);

  const convex = new ConvexHttpClient(convexUrl);

  try {
    // Seed test users
    const userResult = await convex.mutation(api.testing.seedTestUsers, {});
    console.log(`   ✓ Seeded ${userResult.count} test users`);

    // Seed test rooms
    const roomResult = await convex.mutation(api.testing.seedTestRooms, {});
    console.log(`   ✓ Seeded ${roomResult.count} test rooms`);

    // Seed friend relationships
    await convex.mutation(api.testing.seedTestFriendData, {});
    console.log("   ✓ Seeded friend relationships");

    // Seed a scheduled party
    await convex.mutation(api.testing.seedTestScheduledParty, {});
    console.log("   ✓ Seeded scheduled party");

    console.log("✅ Test data seeded successfully\n");
  } catch (error) {
    console.error("❌ Failed to seed test data:", error);
    // Don't throw - allow tests to run anyway (they may use localStorage fallback)
    console.log("   Tests will run with existing data\n");
  }
}

export default globalSetup;
