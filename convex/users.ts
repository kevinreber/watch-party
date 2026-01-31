import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Helper to get random avatar color
function getRandomColor(): string {
  const colors = [
    "#8B5CF6",
    "#EC4899",
    "#F59E0B",
    "#10B981",
    "#3B82F6",
    "#EF4444",
    "#6366F1",
    "#14B8A6",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Sync user from Clerk on first login
export const syncUser = mutation({
  args: {
    clerkId: v.string(),
    username: v.string(),
    email: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      // Update existing user with latest info from Clerk
      await ctx.db.patch(existing._id, {
        username: args.username,
        email: args.email,
        avatar: args.avatar,
      });
      return existing._id;
    }

    // Create new user with defaults
    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      username: args.username,
      email: args.email,
      avatar: args.avatar,
      avatarColor: getRandomColor(),
      stats: {
        totalWatchTime: 0,
        videosWatched: 0,
        partiesHosted: 0,
        partiesJoined: 0,
        messagesSent: 0,
        reactionsGiven: 0,
      },
      themeSettings: {
        mode: "dark",
        accentColor: "#8B5CF6",
        soundEffectsEnabled: true,
        soundVolume: 0.5,
      },
      createdAt: Date.now(),
    });
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return null;

    // Get user's badges
    const badges = await ctx.db
      .query("badges")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return {
      ...user,
      id: user._id,
      badges,
    };
  },
});

export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const badges = await ctx.db
      .query("badges")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return {
      ...user,
      id: user._id,
      badges,
    };
  },
});

export const updateProfile = mutation({
  args: {
    username: v.optional(v.string()),
    avatar: v.optional(v.string()),
    avatarColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const updates: Record<string, string> = {};
    if (args.username !== undefined) updates.username = args.username;
    if (args.avatar !== undefined) updates.avatar = args.avatar;
    if (args.avatarColor !== undefined) updates.avatarColor = args.avatarColor;

    await ctx.db.patch(user._id, updates);
    return user._id;
  },
});

export const updateStats = mutation({
  args: {
    totalWatchTime: v.optional(v.number()),
    videosWatched: v.optional(v.number()),
    partiesHosted: v.optional(v.number()),
    partiesJoined: v.optional(v.number()),
    messagesSent: v.optional(v.number()),
    reactionsGiven: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const newStats = { ...user.stats };
    if (args.totalWatchTime !== undefined)
      newStats.totalWatchTime += args.totalWatchTime;
    if (args.videosWatched !== undefined)
      newStats.videosWatched += args.videosWatched;
    if (args.partiesHosted !== undefined)
      newStats.partiesHosted += args.partiesHosted;
    if (args.partiesJoined !== undefined)
      newStats.partiesJoined += args.partiesJoined;
    if (args.messagesSent !== undefined)
      newStats.messagesSent += args.messagesSent;
    if (args.reactionsGiven !== undefined)
      newStats.reactionsGiven += args.reactionsGiven;

    await ctx.db.patch(user._id, { stats: newStats });
    return user._id;
  },
});

export const updateThemeSettings = mutation({
  args: {
    mode: v.optional(
      v.union(v.literal("light"), v.literal("dark"), v.literal("system"))
    ),
    accentColor: v.optional(v.string()),
    soundEffectsEnabled: v.optional(v.boolean()),
    soundVolume: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("User not found");

    const newSettings = { ...user.themeSettings };
    if (args.mode !== undefined) newSettings.mode = args.mode;
    if (args.accentColor !== undefined) newSettings.accentColor = args.accentColor;
    if (args.soundEffectsEnabled !== undefined)
      newSettings.soundEffectsEnabled = args.soundEffectsEnabled;
    if (args.soundVolume !== undefined) newSettings.soundVolume = args.soundVolume;

    await ctx.db.patch(user._id, { themeSettings: newSettings });
    return user._id;
  },
});

export const searchUsers = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (!args.query || args.query.length < 2) return [];

    // Get all users and filter by username (Convex doesn't have LIKE queries)
    const users = await ctx.db.query("users").collect();

    const searchLower = args.query.toLowerCase();
    return users
      .filter((user) => user.username.toLowerCase().includes(searchLower))
      .slice(0, 10)
      .map((user) => ({
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        avatarColor: user.avatarColor,
      }));
  },
});

// Get user by username for public profile
export const getUserByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (!user) return null;

    return {
      _id: user._id,
      username: user.username,
      avatar: user.avatar,
      avatarColor: user.avatarColor,
      createdAt: user.createdAt,
    };
  },
});

// Get comprehensive public profile
export const getUserProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    // Get badges
    const badges = await ctx.db
      .query("badges")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Get friends count
    const friends = await ctx.db
      .query("friends")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Get public playlists
    const playlists = await ctx.db
      .query("playlists")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const publicPlaylists = playlists.filter((p) => p.isPublic);

    // Get groups
    const groupMemberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Get watch streak
    const streakRecords = await ctx.db
      .query("watchStreaks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const streak = streakRecords[0];

    // Get recent activity (public events only)
    const recentActivity = await ctx.db
      .query("userActivity")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(10);

    // Check if current user is friends with this user
    let isFriend = false;
    let friendRequestStatus = null;
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      const currentUser = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();

      if (currentUser && currentUser._id !== user._id) {
        const friendship = await ctx.db
          .query("friends")
          .withIndex("by_both", (q) =>
            q.eq("userId", currentUser._id).eq("friendId", user._id)
          )
          .first();
        isFriend = !!friendship;

        // Check pending requests
        if (!isFriend) {
          const sentRequest = await ctx.db
            .query("friendRequests")
            .withIndex("by_from_user", (q) => q.eq("fromUserId", currentUser._id))
            .collect();
          const pendingSent = sentRequest.find(
            (r) => r.toUserId === user._id && r.status === "pending"
          );

          const receivedRequest = await ctx.db
            .query("friendRequests")
            .withIndex("by_to_user", (q) => q.eq("toUserId", currentUser._id))
            .collect();
          const pendingReceived = receivedRequest.find(
            (r) => r.fromUserId === user._id && r.status === "pending"
          );

          if (pendingSent) friendRequestStatus = "sent";
          else if (pendingReceived) friendRequestStatus = "received";
        }
      }
    }

    return {
      user: {
        _id: user._id,
        username: user.username,
        avatar: user.avatar,
        avatarColor: user.avatarColor,
        createdAt: new Date(user.createdAt).toISOString(),
      },
      stats: {
        totalWatchTime: user.stats.totalWatchTime,
        videosWatched: user.stats.videosWatched,
        partiesHosted: user.stats.partiesHosted,
        partiesJoined: user.stats.partiesJoined,
        messagesSent: user.stats.messagesSent,
        reactionsGiven: user.stats.reactionsGiven,
      },
      badges: badges.map((b) => ({
        ...b,
        earnedAt: new Date(b.earnedAt).toISOString(),
      })),
      friendsCount: friends.length,
      publicPlaylistsCount: publicPlaylists.length,
      groupsCount: groupMemberships.length,
      streak: streak
        ? {
            currentStreak: streak.currentStreak,
            longestStreak: streak.longestStreak,
            totalDaysWatched: streak.totalDaysWatched,
          }
        : null,
      recentActivity: recentActivity.map((a) => ({
        type: a.type,
        roomName: a.roomName,
        videoName: a.videoName,
        badgeName: a.badgeName,
        createdAt: new Date(a.createdAt).toISOString(),
      })),
      isFriend,
      friendRequestStatus,
    };
  },
});

export const awardBadge = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    description: v.string(),
    icon: v.string(),
    category: v.union(
      v.literal("watching"),
      v.literal("hosting"),
      v.literal("social"),
      v.literal("special")
    ),
  },
  handler: async (ctx, args) => {
    // Check if user already has this badge
    const existingBadges = await ctx.db
      .query("badges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    if (existingBadges.some((b) => b.name === args.name)) {
      return null; // Already has badge
    }

    return await ctx.db.insert("badges", {
      userId: args.userId,
      name: args.name,
      description: args.description,
      icon: args.icon,
      category: args.category,
      earnedAt: Date.now(),
    });
  },
});
