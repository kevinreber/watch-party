import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// PLAYLIST CRUD
// ============================================

export const createPlaylist = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const playlistId = await ctx.db.insert("playlists", {
      userId: user._id,
      name: args.name,
      description: args.description,
      isPublic: args.isPublic,
      videoCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Log activity
    await ctx.db.insert("userActivity", {
      userId: user._id,
      type: "created_playlist",
      playlistId,
      playlistName: args.name,
      isActive: false,
      createdAt: Date.now(),
    });

    return playlistId;
  },
});

export const updatePlaylist = mutation({
  args: {
    playlistId: v.id("playlists"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const playlist = await ctx.db.get(args.playlistId);
    if (!playlist) throw new Error("Playlist not found");
    if (playlist.userId !== user._id) throw new Error("Not authorized");

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.isPublic !== undefined) updates.isPublic = args.isPublic;

    await ctx.db.patch(args.playlistId, updates);
    return { success: true };
  },
});

export const deletePlaylist = mutation({
  args: { playlistId: v.id("playlists") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const playlist = await ctx.db.get(args.playlistId);
    if (!playlist) throw new Error("Playlist not found");
    if (playlist.userId !== user._id) throw new Error("Not authorized");

    // Delete all videos in the playlist
    const videos = await ctx.db
      .query("playlistVideos")
      .withIndex("by_playlist", (q) => q.eq("playlistId", args.playlistId))
      .collect();

    for (const video of videos) {
      await ctx.db.delete(video._id);
    }

    await ctx.db.delete(args.playlistId);
    return { success: true };
  },
});

export const getMyPlaylists = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return [];

    const playlists = await ctx.db
      .query("playlists")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return playlists.map((playlist) => ({
      ...playlist,
      createdAt: new Date(playlist.createdAt).toISOString(),
      updatedAt: new Date(playlist.updatedAt).toISOString(),
    }));
  },
});

export const getPlaylist = query({
  args: { playlistId: v.id("playlists") },
  handler: async (ctx, args) => {
    const playlist = await ctx.db.get(args.playlistId);
    if (!playlist) return null;

    // Check access for private playlists
    if (!playlist.isPublic) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) return null;

      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();
      if (!user || playlist.userId !== user._id) return null;
    }

    // Get owner info
    const owner = await ctx.db.get(playlist.userId);

    // Get videos
    const videos = await ctx.db
      .query("playlistVideos")
      .withIndex("by_playlist_position", (q) => q.eq("playlistId", args.playlistId))
      .collect();

    return {
      ...playlist,
      owner: owner
        ? { username: owner.username, avatar: owner.avatar, avatarColor: owner.avatarColor }
        : null,
      videos: videos.sort((a, b) => a.position - b.position),
      createdAt: new Date(playlist.createdAt).toISOString(),
      updatedAt: new Date(playlist.updatedAt).toISOString(),
    };
  },
});

export const getPublicPlaylists = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const playlists = await ctx.db
      .query("playlists")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .take(args.limit || 20);

    return Promise.all(
      playlists.map(async (playlist) => {
        const owner = await ctx.db.get(playlist.userId);
        return {
          ...playlist,
          owner: owner
            ? { username: owner.username, avatar: owner.avatar, avatarColor: owner.avatarColor }
            : null,
          createdAt: new Date(playlist.createdAt).toISOString(),
        };
      })
    );
  },
});

// ============================================
// PLAYLIST VIDEOS
// ============================================

export const addVideoToPlaylist = mutation({
  args: {
    playlistId: v.id("playlists"),
    videoId: v.string(),
    url: v.string(),
    name: v.string(),
    channel: v.optional(v.string()),
    img: v.optional(v.string()),
    duration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const playlist = await ctx.db.get(args.playlistId);
    if (!playlist) throw new Error("Playlist not found");
    if (playlist.userId !== user._id) throw new Error("Not authorized");

    // Get current max position
    const videos = await ctx.db
      .query("playlistVideos")
      .withIndex("by_playlist", (q) => q.eq("playlistId", args.playlistId))
      .collect();

    const maxPosition = videos.length > 0 ? Math.max(...videos.map((v) => v.position)) : -1;

    const videoEntryId = await ctx.db.insert("playlistVideos", {
      playlistId: args.playlistId,
      videoId: args.videoId,
      url: args.url,
      name: args.name,
      channel: args.channel,
      img: args.img,
      duration: args.duration,
      position: maxPosition + 1,
      addedAt: Date.now(),
    });

    // Update playlist video count and cover image
    const updates: Record<string, unknown> = {
      videoCount: playlist.videoCount + 1,
      updatedAt: Date.now(),
    };
    if (!playlist.coverImage && args.img) {
      updates.coverImage = args.img;
    }
    if (args.duration) {
      updates.totalDuration = (playlist.totalDuration || 0) + args.duration;
    }

    await ctx.db.patch(args.playlistId, updates);

    return videoEntryId;
  },
});

export const removeVideoFromPlaylist = mutation({
  args: {
    playlistId: v.id("playlists"),
    videoEntryId: v.id("playlistVideos"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const playlist = await ctx.db.get(args.playlistId);
    if (!playlist) throw new Error("Playlist not found");
    if (playlist.userId !== user._id) throw new Error("Not authorized");

    const videoEntry = await ctx.db.get(args.videoEntryId);
    if (!videoEntry || videoEntry.playlistId !== args.playlistId) {
      throw new Error("Video not found in playlist");
    }

    await ctx.db.delete(args.videoEntryId);

    // Update playlist
    const updates: Record<string, unknown> = {
      videoCount: Math.max(0, playlist.videoCount - 1),
      updatedAt: Date.now(),
    };
    if (videoEntry.duration && playlist.totalDuration) {
      updates.totalDuration = Math.max(0, playlist.totalDuration - videoEntry.duration);
    }

    await ctx.db.patch(args.playlistId, updates);

    return { success: true };
  },
});

export const reorderPlaylistVideos = mutation({
  args: {
    playlistId: v.id("playlists"),
    videoEntryId: v.id("playlistVideos"),
    newPosition: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const playlist = await ctx.db.get(args.playlistId);
    if (!playlist) throw new Error("Playlist not found");
    if (playlist.userId !== user._id) throw new Error("Not authorized");

    const videoEntry = await ctx.db.get(args.videoEntryId);
    if (!videoEntry || videoEntry.playlistId !== args.playlistId) {
      throw new Error("Video not found in playlist");
    }

    const oldPosition = videoEntry.position;
    if (oldPosition === args.newPosition) return { success: true };

    // Get all videos and reorder
    const videos = await ctx.db
      .query("playlistVideos")
      .withIndex("by_playlist", (q) => q.eq("playlistId", args.playlistId))
      .collect();

    for (const video of videos) {
      if (video._id === args.videoEntryId) {
        await ctx.db.patch(video._id, { position: args.newPosition });
      } else if (oldPosition < args.newPosition) {
        // Moving down: shift items in between up
        if (video.position > oldPosition && video.position <= args.newPosition) {
          await ctx.db.patch(video._id, { position: video.position - 1 });
        }
      } else {
        // Moving up: shift items in between down
        if (video.position >= args.newPosition && video.position < oldPosition) {
          await ctx.db.patch(video._id, { position: video.position + 1 });
        }
      }
    }

    await ctx.db.patch(args.playlistId, { updatedAt: Date.now() });

    return { success: true };
  },
});

// Load playlist into a room
export const loadPlaylistToRoom = mutation({
  args: {
    playlistId: v.id("playlists"),
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const playlist = await ctx.db.get(args.playlistId);
    if (!playlist) throw new Error("Playlist not found");

    // Check playlist access
    if (!playlist.isPublic && playlist.userId !== user._id) {
      throw new Error("Not authorized to access this playlist");
    }

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    // Check room access (owner or co-host)
    const membership = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", user._id)
      )
      .first();

    const isOwner = room.ownerId === user._id;
    const isCohost = membership?.role === "cohost";
    if (!isOwner && !isCohost) {
      throw new Error("Not authorized to modify room queue");
    }

    // Get playlist videos
    const videos = await ctx.db
      .query("playlistVideos")
      .withIndex("by_playlist_position", (q) => q.eq("playlistId", args.playlistId))
      .collect();

    const sortedVideos = videos.sort((a, b) => a.position - b.position);

    // Convert to room queue format
    const queueVideos = sortedVideos.map((v) => ({
      videoId: v.videoId,
      url: v.url,
      name: v.name,
      channel: v.channel,
      img: v.img,
    }));

    // Set first video as current and rest as queue
    if (queueVideos.length > 0) {
      const [firstVideo, ...restVideos] = queueVideos;
      await ctx.db.patch(args.roomId, {
        currentVideo: firstVideo,
        videoQueue: restVideos,
        isPlaying: false,
        currentTime: 0,
        lastSyncAt: Date.now(),
      });
    }

    return { success: true, videosLoaded: queueVideos.length };
  },
});
