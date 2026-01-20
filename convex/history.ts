import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Watch History
export const addToWatchHistory = mutation({
  args: {
    videoId: v.string(),
    videoName: v.string(),
    videoChannel: v.optional(v.string()),
    videoImg: v.optional(v.string()),
    roomId: v.optional(v.id("rooms")),
    roomName: v.optional(v.string()),
    watchDuration: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const historyId = await ctx.db.insert("watchHistory", {
      userId: user._id,
      videoId: args.videoId,
      videoName: args.videoName,
      videoChannel: args.videoChannel,
      videoImg: args.videoImg,
      roomId: args.roomId,
      roomName: args.roomName,
      watchDuration: args.watchDuration,
      watchedAt: Date.now(),
    });

    // Update user stats
    await ctx.db.patch(user._id, {
      stats: {
        ...user.stats,
        videosWatched: user.stats.videosWatched + 1,
        totalWatchTime: user.stats.totalWatchTime + Math.floor(args.watchDuration / 60),
      },
    });

    return historyId;
  },
});

export const getWatchHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return [];

    const history = await ctx.db
      .query("watchHistory")
      .withIndex("by_user_and_time", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit || 100);

    return history.map((item) => ({
      ...item,
      watchedAt: new Date(item.watchedAt).toISOString(),
    }));
  },
});

// Room History
export const addToRoomHistory = mutation({
  args: {
    roomId: v.id("rooms"),
    roomName: v.string(),
    watchTime: v.number(),
    videosWatched: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    return await ctx.db.insert("roomHistory", {
      userId: user._id,
      roomId: args.roomId,
      roomName: args.roomName,
      watchTime: args.watchTime,
      videosWatched: args.videosWatched,
      visitedAt: Date.now(),
    });
  },
});

export const getRoomHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return [];

    const history = await ctx.db
      .query("roomHistory")
      .withIndex("by_user_and_time", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit || 50);

    return history.map((item) => ({
      ...item,
      visitedAt: new Date(item.visitedAt).toISOString(),
    }));
  },
});

// Favorite Videos
export const addFavoriteVideo = mutation({
  args: {
    videoId: v.string(),
    url: v.string(),
    name: v.string(),
    channel: v.optional(v.string()),
    img: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    // Check if already favorited
    const existing = await ctx.db
      .query("favoriteVideos")
      .withIndex("by_user_and_video", (q) =>
        q.eq("userId", user._id).eq("videoId", args.videoId)
      )
      .first();

    if (existing) {
      // Increment play count
      await ctx.db.patch(existing._id, {
        playCount: existing.playCount + 1,
      });
      return existing._id;
    }

    return await ctx.db.insert("favoriteVideos", {
      userId: user._id,
      videoId: args.videoId,
      url: args.url,
      name: args.name,
      channel: args.channel,
      img: args.img,
      playCount: 1,
      addedAt: Date.now(),
    });
  },
});

export const removeFavoriteVideo = mutation({
  args: { videoId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const favorite = await ctx.db
      .query("favoriteVideos")
      .withIndex("by_user_and_video", (q) =>
        q.eq("userId", user._id).eq("videoId", args.videoId)
      )
      .first();

    if (favorite) {
      await ctx.db.delete(favorite._id);
    }

    return { success: true };
  },
});

export const getFavoriteVideos = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return [];

    const favorites = await ctx.db
      .query("favoriteVideos")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return favorites.map((fav) => ({
      ...fav,
      addedAt: new Date(fav.addedAt).toISOString(),
    }));
  },
});

// Room Bookmarks
export const addRoomBookmark = mutation({
  args: {
    roomId: v.id("rooms"),
    roomName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    // Check if already bookmarked
    const existing = await ctx.db
      .query("roomBookmarks")
      .withIndex("by_user_and_room", (q) =>
        q.eq("userId", user._id).eq("roomId", args.roomId)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("roomBookmarks", {
      userId: user._id,
      roomId: args.roomId,
      roomName: args.roomName,
      bookmarkedAt: Date.now(),
    });
  },
});

export const removeRoomBookmark = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const bookmark = await ctx.db
      .query("roomBookmarks")
      .withIndex("by_user_and_room", (q) =>
        q.eq("userId", user._id).eq("roomId", args.roomId)
      )
      .first();

    if (bookmark) {
      await ctx.db.delete(bookmark._id);
    }

    return { success: true };
  },
});

export const getRoomBookmarks = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return [];

    const bookmarks = await ctx.db
      .query("roomBookmarks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Get room details for each bookmark
    return Promise.all(
      bookmarks.map(async (bookmark) => {
        const room = await ctx.db.get(bookmark.roomId);
        return {
          ...bookmark,
          bookmarkedAt: new Date(bookmark.bookmarkedAt).toISOString(),
          lastVisited: bookmark.lastVisited
            ? new Date(bookmark.lastVisited).toISOString()
            : undefined,
          roomExists: !!room,
          currentUsers: room
            ? (
                await ctx.db
                  .query("roomMembers")
                  .withIndex("by_room", (q) => q.eq("roomId", bookmark.roomId))
                  .collect()
              ).length
            : 0,
        };
      })
    );
  },
});

export const updateBookmarkLastVisited = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return;

    const bookmark = await ctx.db
      .query("roomBookmarks")
      .withIndex("by_user_and_room", (q) =>
        q.eq("userId", user._id).eq("roomId", args.roomId)
      )
      .first();

    if (bookmark) {
      await ctx.db.patch(bookmark._id, { lastVisited: Date.now() });
    }
  },
});
