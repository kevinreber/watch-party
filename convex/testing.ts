/**
 * Test utilities for seeding and clearing data in Convex.
 * Only available in development/test environments.
 */
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Only allow these mutations in development/test
const isDev = process.env.NODE_ENV !== "production";

/**
 * Seed test users for e2e testing
 */
export const seedTestUsers = mutation({
  args: {},
  handler: async (ctx) => {
    if (!isDev) throw new Error("Test utilities only available in development");

    const testUsers = [
      {
        clerkId: "test_user_1",
        username: "TestUser1",
        email: "test1@example.com",
        avatarColor: "#8B5CF6",
      },
      {
        clerkId: "test_user_2",
        username: "MovieLover42",
        email: "movielover@example.com",
        avatarColor: "#EC4899",
      },
      {
        clerkId: "test_user_3",
        username: "StreamFan99",
        email: "streamfan@example.com",
        avatarColor: "#10B981",
      },
      {
        clerkId: "test_user_4",
        username: "WatchPartyHost",
        email: "host@example.com",
        avatarColor: "#F59E0B",
      },
    ];

    const createdIds: string[] = [];

    for (const userData of testUsers) {
      // Check if user already exists
      const existing = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", userData.clerkId))
        .first();

      if (existing) {
        createdIds.push(existing._id);
        continue;
      }

      const userId = await ctx.db.insert("users", {
        ...userData,
        avatar: undefined,
        stats: {
          totalWatchTime: Math.floor(Math.random() * 10000),
          videosWatched: Math.floor(Math.random() * 100),
          partiesHosted: Math.floor(Math.random() * 20),
          partiesJoined: Math.floor(Math.random() * 50),
          messagesSent: Math.floor(Math.random() * 500),
          reactionsGiven: Math.floor(Math.random() * 200),
        },
        themeSettings: {
          mode: "dark",
          accentColor: userData.avatarColor,
          soundEffectsEnabled: true,
          soundVolume: 0.5,
        },
        createdAt: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000),
      });

      createdIds.push(userId);

      // Add some badges
      await ctx.db.insert("badges", {
        userId,
        name: "Early Adopter",
        description: "Joined during beta",
        icon: "🌟",
        category: "special",
        earnedAt: Date.now(),
      });
    }

    return { userIds: createdIds, count: createdIds.length };
  },
});

/**
 * Seed test rooms for e2e testing
 */
export const seedTestRooms = mutation({
  args: {},
  handler: async (ctx) => {
    if (!isDev) throw new Error("Test utilities only available in development");

    // Get first test user as owner
    const owner = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", "test_user_1"))
      .first();

    if (!owner) {
      throw new Error("Seed users first with seedTestUsers");
    }

    const testRooms = [
      { name: "test-room", isPrivate: false, isPersistent: true },
      { name: "movie-night", isPrivate: false, isPersistent: true },
      { name: "private-room", isPrivate: true, password: "secret123", isPersistent: false },
    ];

    const createdIds: string[] = [];

    for (const roomData of testRooms) {
      // Check if room with name exists (by checking all rooms - not ideal but works for testing)
      const existingRooms = await ctx.db.query("rooms").collect();
      const existing = existingRooms.find((r) => r.name === roomData.name);

      if (existing) {
        createdIds.push(existing._id);
        continue;
      }

      const roomId = await ctx.db.insert("rooms", {
        name: roomData.name,
        ownerId: owner._id,
        isPrivate: roomData.isPrivate,
        password: roomData.password,
        maxCapacity: 50,
        isPersistent: roomData.isPersistent,
        theme: {
          backgroundColor: "#1a1a2e",
          accentColor: "#8B5CF6",
          chatBackground: "#16213e",
        },
        currentVideo: undefined,
        videoQueue: [],
        isPlaying: false,
        currentTime: 0,
        lastSyncAt: Date.now(),
        createdAt: Date.now(),
      });

      createdIds.push(roomId);
    }

    return { roomIds: createdIds, count: createdIds.length };
  },
});

/**
 * Seed test messages for a room
 */
export const seedTestMessages = mutation({
  args: {
    roomName: v.string(),
  },
  handler: async (ctx, args) => {
    if (!isDev) throw new Error("Test utilities only available in development");

    // Find room by name
    const rooms = await ctx.db.query("rooms").collect();
    const room = rooms.find((r) => r.name === args.roomName);
    if (!room) throw new Error(`Room ${args.roomName} not found`);

    // Get test users
    const users = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", "test_user_1"))
      .collect();

    if (users.length === 0) throw new Error("No test users found");

    const testMessages = [
      { content: "Hey everyone! 👋", type: "chat" as const },
      { content: "Ready to watch?", type: "chat" as const },
      { content: "This is going to be fun!", type: "chat" as const },
      { content: "Let's gooo!", type: "chat" as const },
    ];

    const createdIds: string[] = [];

    for (let i = 0; i < testMessages.length; i++) {
      const msg = testMessages[i];
      const messageId = await ctx.db.insert("messages", {
        roomId: room._id,
        userId: users[0]._id,
        type: msg.type,
        content: msg.content,
        createdAt: Date.now() - (testMessages.length - i) * 1000,
      });
      createdIds.push(messageId);
    }

    return { messageIds: createdIds, count: createdIds.length };
  },
});

/**
 * Seed test polls for a room
 */
export const seedTestPolls = mutation({
  args: {
    roomName: v.string(),
  },
  handler: async (ctx, args) => {
    if (!isDev) throw new Error("Test utilities only available in development");

    // Find room by name
    const rooms = await ctx.db.query("rooms").collect();
    const room = rooms.find((r) => r.name === args.roomName);
    if (!room) throw new Error(`Room ${args.roomName} not found`);

    // Get test user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", "test_user_1"))
      .first();
    if (!user) throw new Error("No test user found");

    const pollId = await ctx.db.insert("polls", {
      roomId: room._id,
      createdBy: user._id,
      question: "What should we watch next?",
      options: [
        { id: "opt1", text: "Action Movie", votes: 3 },
        { id: "opt2", text: "Comedy Show", votes: 5 },
        { id: "opt3", text: "Documentary", votes: 2 },
      ],
      isActive: true,
      endsAt: Date.now() + 30 * 60 * 1000, // 30 minutes
      createdAt: Date.now(),
    });

    return { pollId };
  },
});

/**
 * Seed friend requests between test users
 */
export const seedTestFriendData = mutation({
  args: {},
  handler: async (ctx) => {
    if (!isDev) throw new Error("Test utilities only available in development");

    const user1 = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", "test_user_1"))
      .first();
    const user2 = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", "test_user_2"))
      .first();
    const user3 = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", "test_user_3"))
      .first();

    if (!user1 || !user2 || !user3) {
      throw new Error("Seed users first with seedTestUsers");
    }

    // Make user1 and user2 friends
    const existingFriendship = await ctx.db
      .query("friends")
      .withIndex("by_both", (q) => q.eq("userId", user1._id).eq("friendId", user2._id))
      .first();

    if (!existingFriendship) {
      await ctx.db.insert("friends", {
        userId: user1._id,
        friendId: user2._id,
        addedAt: Date.now(),
      });
      await ctx.db.insert("friends", {
        userId: user2._id,
        friendId: user1._id,
        addedAt: Date.now(),
      });
    }

    // Create pending friend request from user3 to user1
    const existingRequest = await ctx.db
      .query("friendRequests")
      .withIndex("by_from_user", (q) => q.eq("fromUserId", user3._id))
      .first();

    if (!existingRequest) {
      await ctx.db.insert("friendRequests", {
        fromUserId: user3._id,
        toUserId: user1._id,
        status: "pending",
        sentAt: Date.now(),
      });
    }

    return { success: true };
  },
});

/**
 * Seed a scheduled party
 */
export const seedTestScheduledParty = mutation({
  args: {},
  handler: async (ctx) => {
    if (!isDev) throw new Error("Test utilities only available in development");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", "test_user_1"))
      .first();

    if (!user) throw new Error("Seed users first");

    const partyId = await ctx.db.insert("scheduledParties", {
      name: "Friday Movie Night",
      description: "Weekly movie watching session",
      createdBy: user._id,
      scheduledFor: Date.now() + 2 * 24 * 60 * 60 * 1000, // 2 days from now
      roomId: undefined,
      videos: [
        {
          videoId: "dQw4w9WgXcQ",
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          name: "Test Video",
          channel: "Test Channel",
          img: "https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg",
        },
      ],
      isRecurring: true,
      recurrencePattern: "weekly",
      createdAt: Date.now(),
    });

    return { partyId };
  },
});

/**
 * Seed all test data at once
 */
export const seedAllTestData = mutation({
  args: {},
  handler: async (ctx) => {
    if (!isDev) throw new Error("Test utilities only available in development");

    // This will call all the individual seed functions
    // Note: In a real implementation, you'd want to batch these
    return { message: "Use individual seed functions for better control" };
  },
});

/**
 * Clear all test data
 */
export const clearTestData = mutation({
  args: {},
  handler: async (ctx) => {
    if (!isDev) throw new Error("Test utilities only available in development");

    // Get all test users
    const testClerkIds = ["test_user_1", "test_user_2", "test_user_3", "test_user_4"];

    for (const clerkId of testClerkIds) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
        .first();

      if (user) {
        // Delete user's badges
        const badges = await ctx.db
          .query("badges")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();
        for (const badge of badges) {
          await ctx.db.delete(badge._id);
        }

        // Delete user's friend data
        const friendships = await ctx.db
          .query("friends")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();
        for (const f of friendships) {
          await ctx.db.delete(f._id);
        }

        // Delete rooms owned by user
        const rooms = await ctx.db
          .query("rooms")
          .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
          .collect();
        for (const room of rooms) {
          // Delete room members
          const members = await ctx.db
            .query("roomMembers")
            .withIndex("by_room", (q) => q.eq("roomId", room._id))
            .collect();
          for (const m of members) {
            await ctx.db.delete(m._id);
          }

          // Delete room messages
          const messages = await ctx.db
            .query("messages")
            .withIndex("by_room", (q) => q.eq("roomId", room._id))
            .collect();
          for (const msg of messages) {
            await ctx.db.delete(msg._id);
          }

          // Delete room polls
          const polls = await ctx.db
            .query("polls")
            .withIndex("by_room", (q) => q.eq("roomId", room._id))
            .collect();
          for (const poll of polls) {
            const votes = await ctx.db
              .query("pollVotes")
              .withIndex("by_poll", (q) => q.eq("pollId", poll._id))
              .collect();
            for (const vote of votes) {
              await ctx.db.delete(vote._id);
            }
            await ctx.db.delete(poll._id);
          }

          await ctx.db.delete(room._id);
        }

        // Delete the user
        await ctx.db.delete(user._id);
      }
    }

    return { success: true, message: "Test data cleared" };
  },
});

/**
 * Get test data status - check what test data exists
 */
export const getTestDataStatus = query({
  args: {},
  handler: async (ctx) => {
    if (!isDev) return { error: "Test utilities only available in development" };

    const testUserCount = await ctx.db
      .query("users")
      .filter((q) =>
        q.or(
          q.eq(q.field("clerkId"), "test_user_1"),
          q.eq(q.field("clerkId"), "test_user_2"),
          q.eq(q.field("clerkId"), "test_user_3"),
          q.eq(q.field("clerkId"), "test_user_4")
        )
      )
      .collect();

    const allRooms = await ctx.db.query("rooms").collect();
    const testRoomNames = ["test-room", "movie-night", "private-room"];
    const testRooms = allRooms.filter((r) => testRoomNames.includes(r.name));

    return {
      users: testUserCount.length,
      rooms: testRooms.length,
      isSeeded: testUserCount.length > 0 && testRooms.length > 0,
    };
  },
});
