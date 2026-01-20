import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const videoValidator = v.object({
  videoId: v.string(),
  url: v.string(),
  name: v.string(),
  channel: v.optional(v.string()),
  img: v.optional(v.string()),
});

export const syncVideoState = mutation({
  args: {
    roomId: v.id("rooms"),
    type: v.union(
      v.literal("play"),
      v.literal("pause"),
      v.literal("seek"),
      v.literal("video-change")
    ),
    currentTime: v.number(),
    video: v.optional(videoValidator),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    const updates: Record<string, unknown> = {
      currentTime: args.currentTime,
      lastSyncAt: Date.now(),
    };

    if (args.type === "play") {
      updates.isPlaying = true;
    } else if (args.type === "pause") {
      updates.isPlaying = false;
    } else if (args.type === "video-change" && args.video) {
      updates.currentVideo = args.video;
      updates.currentTime = 0;
      updates.isPlaying = true;
    }

    await ctx.db.patch(args.roomId, updates);
    return { success: true };
  },
});

export const getVideoState = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) return null;

    return {
      currentVideo: room.currentVideo,
      videoQueue: room.videoQueue,
      isPlaying: room.isPlaying,
      currentTime: room.currentTime,
      lastSyncAt: room.lastSyncAt,
    };
  },
});

export const addToQueue = mutation({
  args: {
    roomId: v.id("rooms"),
    video: videoValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    const newQueue = [...room.videoQueue, args.video];
    await ctx.db.patch(args.roomId, { videoQueue: newQueue });

    // If no video is currently playing, start this one
    if (!room.currentVideo) {
      await ctx.db.patch(args.roomId, {
        currentVideo: args.video,
        videoQueue: newQueue.slice(1),
        isPlaying: true,
        currentTime: 0,
        lastSyncAt: Date.now(),
      });
    }

    return { success: true };
  },
});

export const removeFromQueue = mutation({
  args: {
    roomId: v.id("rooms"),
    videoId: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    const newQueue = room.videoQueue.filter((v) => v.videoId !== args.videoId);
    await ctx.db.patch(args.roomId, { videoQueue: newQueue });

    return { success: true };
  },
});

export const reorderQueue = mutation({
  args: {
    roomId: v.id("rooms"),
    videos: v.array(videoValidator),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    await ctx.db.patch(args.roomId, { videoQueue: args.videos });

    return { success: true };
  },
});

export const clearQueue = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    await ctx.db.patch(args.roomId, { videoQueue: [] });

    return { success: true };
  },
});

export const playNext = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    if (room.videoQueue.length === 0) {
      // No more videos in queue
      await ctx.db.patch(args.roomId, {
        currentVideo: undefined,
        isPlaying: false,
        currentTime: 0,
        lastSyncAt: Date.now(),
      });
      return { success: true, hasNext: false };
    }

    const [nextVideo, ...remainingQueue] = room.videoQueue;
    await ctx.db.patch(args.roomId, {
      currentVideo: nextVideo,
      videoQueue: remainingQueue,
      isPlaying: true,
      currentTime: 0,
      lastSyncAt: Date.now(),
    });

    return { success: true, hasNext: true, video: nextVideo };
  },
});

export const setCurrentVideo = mutation({
  args: {
    roomId: v.id("rooms"),
    video: videoValidator,
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    await ctx.db.patch(args.roomId, {
      currentVideo: args.video,
      isPlaying: true,
      currentTime: 0,
      lastSyncAt: Date.now(),
    });

    return { success: true };
  },
});
