import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// ACTIVITY LOGGING
// ============================================

export const logActivity = mutation({
  args: {
    type: v.union(
      v.literal("watching"),
      v.literal("joined_room"),
      v.literal("created_room"),
      v.literal("started_party"),
      v.literal("added_friend"),
      v.literal("earned_badge"),
      v.literal("created_playlist"),
      v.literal("joined_group")
    ),
    roomId: v.optional(v.id("rooms")),
    roomName: v.optional(v.string()),
    videoName: v.optional(v.string()),
    friendId: v.optional(v.id("users")),
    friendName: v.optional(v.string()),
    badgeName: v.optional(v.string()),
    playlistId: v.optional(v.id("playlists")),
    playlistName: v.optional(v.string()),
    groupId: v.optional(v.id("groups")),
    groupName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    // For "watching" type, end any previous active watching activities
    if (args.type === "watching") {
      const activeWatching = await ctx.db
        .query("userActivity")
        .withIndex("by_user_active", (q) => q.eq("userId", user._id).eq("isActive", true))
        .collect();

      for (const activity of activeWatching) {
        if (activity.type === "watching") {
          await ctx.db.patch(activity._id, {
            isActive: false,
            endedAt: Date.now(),
          });
        }
      }
    }

    const activityId = await ctx.db.insert("userActivity", {
      userId: user._id,
      type: args.type,
      roomId: args.roomId,
      roomName: args.roomName,
      videoName: args.videoName,
      friendId: args.friendId,
      friendName: args.friendName,
      badgeName: args.badgeName,
      playlistId: args.playlistId,
      playlistName: args.playlistName,
      groupId: args.groupId,
      groupName: args.groupName,
      isActive: args.type === "watching",
      createdAt: Date.now(),
    });

    return activityId;
  },
});

export const endWatchingActivity = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return;

    const activeWatching = await ctx.db
      .query("userActivity")
      .withIndex("by_user_active", (q) => q.eq("userId", user._id).eq("isActive", true))
      .collect();

    for (const activity of activeWatching) {
      await ctx.db.patch(activity._id, {
        isActive: false,
        endedAt: Date.now(),
      });
    }
  },
});

export const updateWatchingActivity = mutation({
  args: {
    videoName: v.string(),
    roomId: v.id("rooms"),
    roomName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return;

    // Find active watching activity
    const activeWatching = await ctx.db
      .query("userActivity")
      .withIndex("by_user_active", (q) => q.eq("userId", user._id).eq("isActive", true))
      .first();

    if (activeWatching && activeWatching.type === "watching") {
      await ctx.db.patch(activeWatching._id, {
        videoName: args.videoName,
        roomId: args.roomId,
        roomName: args.roomName,
      });
    } else {
      // Create new watching activity
      await ctx.db.insert("userActivity", {
        userId: user._id,
        type: "watching",
        roomId: args.roomId,
        roomName: args.roomName,
        videoName: args.videoName,
        isActive: true,
        createdAt: Date.now(),
      });
    }
  },
});

// ============================================
// ACTIVITY QUERIES
// ============================================

export const getMyActivity = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return [];

    const activities = await ctx.db
      .query("userActivity")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit || 50);

    return activities.map((activity) => ({
      ...activity,
      createdAt: new Date(activity.createdAt).toISOString(),
      endedAt: activity.endedAt ? new Date(activity.endedAt).toISOString() : undefined,
    }));
  },
});

export const getFriendsActivity = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return [];

    // Get friend IDs
    const friendships = await ctx.db
      .query("friends")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const friendIds = friendships.map((f) => f.friendId);
    if (friendIds.length === 0) return [];

    // Get recent activities from friends (last 24 hours for performance)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    const allActivities = await ctx.db
      .query("userActivity")
      .withIndex("by_created", (q) => q.gt("createdAt", oneDayAgo))
      .order("desc")
      .take(200);

    // Filter to only friends' activities
    const friendActivities = allActivities.filter((a) =>
      friendIds.some((id) => id === a.userId)
    );

    // Add user info and return
    const activitiesWithUser = await Promise.all(
      friendActivities.slice(0, args.limit || 50).map(async (activity) => {
        const activityUser = await ctx.db.get(activity.userId);
        return {
          ...activity,
          user: activityUser
            ? {
                _id: activityUser._id,
                username: activityUser.username,
                avatar: activityUser.avatar,
                avatarColor: activityUser.avatarColor,
              }
            : null,
          createdAt: new Date(activity.createdAt).toISOString(),
          endedAt: activity.endedAt ? new Date(activity.endedAt).toISOString() : undefined,
        };
      })
    );

    return activitiesWithUser;
  },
});

export const getActiveWatchers = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return [];

    // Get friend IDs
    const friendships = await ctx.db
      .query("friends")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const friendIds = friendships.map((f) => f.friendId);
    if (friendIds.length === 0) return [];

    // Get all active watching activities
    const allActive = await ctx.db
      .query("userActivity")
      .withIndex("by_type", (q) => q.eq("type", "watching"))
      .collect();

    const activeWatching = allActive.filter((a) =>
      a.isActive && friendIds.some((id) => id === a.userId)
    );

    // Add user info
    const watchersWithInfo = await Promise.all(
      activeWatching.map(async (activity) => {
        const watchingUser = await ctx.db.get(activity.userId);
        return {
          ...activity,
          user: watchingUser
            ? {
                _id: watchingUser._id,
                username: watchingUser.username,
                avatar: watchingUser.avatar,
                avatarColor: watchingUser.avatarColor,
              }
            : null,
          createdAt: new Date(activity.createdAt).toISOString(),
        };
      })
    );

    return watchersWithInfo.filter((w) => w.user !== null);
  },
});

export const getUserActivity = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Public user activity (for profile pages)
    const activities = await ctx.db
      .query("userActivity")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 20);

    const targetUser = await ctx.db.get(args.userId);

    return {
      user: targetUser
        ? {
            _id: targetUser._id,
            username: targetUser.username,
            avatar: targetUser.avatar,
            avatarColor: targetUser.avatarColor,
          }
        : null,
      activities: activities.map((activity) => ({
        ...activity,
        createdAt: new Date(activity.createdAt).toISOString(),
        endedAt: activity.endedAt ? new Date(activity.endedAt).toISOString() : undefined,
      })),
    };
  },
});
