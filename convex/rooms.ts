import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createRoom = mutation({
  args: {
    name: v.string(),
    isPrivate: v.boolean(),
    password: v.optional(v.string()),
    maxCapacity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const roomId = await ctx.db.insert("rooms", {
      name: args.name,
      ownerId: user._id,
      isPrivate: args.isPrivate,
      password: args.password,
      maxCapacity: args.maxCapacity || 10,
      isPersistent: false,
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

    // Auto-join the creator
    await ctx.db.insert("roomMembers", {
      roomId,
      userId: user._id,
      joinedAt: Date.now(),
      lastActiveAt: Date.now(),
      isTyping: false,
    });

    // Update user stats
    await ctx.db.patch(user._id, {
      stats: {
        ...user.stats,
        partiesHosted: user.stats.partiesHosted + 1,
      },
    });

    return roomId;
  },
});

export const joinRoom = mutation({
  args: {
    roomId: v.id("rooms"),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    // Check password if private
    if (room.isPrivate && room.password && room.password !== args.password) {
      throw new Error("Invalid password");
    }

    // Check capacity
    const members = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    if (members.length >= room.maxCapacity) {
      throw new Error("Room is full");
    }

    // Check if already a member
    const existingMember = members.find(
      (m) => m.userId.toString() === user._id.toString()
    );
    if (existingMember) {
      // Update last active time
      await ctx.db.patch(existingMember._id, {
        lastActiveAt: Date.now(),
      });
      return existingMember._id;
    }

    // Join room
    const memberId = await ctx.db.insert("roomMembers", {
      roomId: args.roomId,
      userId: user._id,
      joinedAt: Date.now(),
      lastActiveAt: Date.now(),
      isTyping: false,
    });

    // Update user stats
    await ctx.db.patch(user._id, {
      stats: {
        ...user.stats,
        partiesJoined: user.stats.partiesJoined + 1,
      },
    });

    // Add system message
    await ctx.db.insert("messages", {
      roomId: args.roomId,
      userId: user._id,
      type: "admin",
      content: `${user.username} joined the room`,
      createdAt: Date.now(),
    });

    return memberId;
  },
});

export const leaveRoom = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const member = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", user._id)
      )
      .first();

    if (member) {
      await ctx.db.delete(member._id);

      // Add system message
      await ctx.db.insert("messages", {
        roomId: args.roomId,
        userId: user._id,
        type: "admin",
        content: `${user.username} left the room`,
        createdAt: Date.now(),
      });
    }

    // Check if room is empty and not persistent
    const room = await ctx.db.get(args.roomId);
    const remainingMembers = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    if (remainingMembers.length === 0 && room && !room.isPersistent) {
      // Delete all messages in the room
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
        .collect();
      for (const message of messages) {
        await ctx.db.delete(message._id);
      }

      // Delete all polls in the room
      const polls = await ctx.db
        .query("polls")
        .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
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

      // Delete the room
      await ctx.db.delete(args.roomId);
    }
  },
});

export const getRoom = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) return null;

    const owner = await ctx.db.get(room.ownerId);
    const members = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    // Get user details for each member
    const membersWithDetails = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        return {
          id: member.userId,
          oderId: member._id,
          username: user?.username || "Unknown",
          avatar: user?.avatar,
          avatarColor: user?.avatarColor || "#8B5CF6",
          isTyping: member.isTyping,
          joinedAt: member.joinedAt,
          lastActiveAt: member.lastActiveAt,
        };
      })
    );

    return {
      id: room._id,
      name: room.name,
      ownerId: room.ownerId,
      ownerName: owner?.username || "Unknown",
      isPrivate: room.isPrivate,
      hasPassword: !!room.password,
      maxCapacity: room.maxCapacity,
      currentUsers: members.length,
      members: membersWithDetails,
      theme: room.theme,
      isPersistent: room.isPersistent,
      currentVideo: room.currentVideo,
      videoQueue: room.videoQueue,
      isPlaying: room.isPlaying,
      currentTime: room.currentTime,
      lastSyncAt: room.lastSyncAt,
      createdAt: room.createdAt,
    };
  },
});

export const getRoomMembers = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    return Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        return {
          id: member.userId,
          username: user?.username || "Unknown",
          avatar: user?.avatar,
          avatarColor: user?.avatarColor || "#8B5CF6",
          isTyping: member.isTyping,
          joinedAt: member.joinedAt,
        };
      })
    );
  },
});

export const updateRoom = mutation({
  args: {
    roomId: v.id("rooms"),
    name: v.optional(v.string()),
    isPrivate: v.optional(v.boolean()),
    password: v.optional(v.string()),
    maxCapacity: v.optional(v.number()),
    isPersistent: v.optional(v.boolean()),
    theme: v.optional(
      v.object({
        backgroundColor: v.string(),
        accentColor: v.string(),
        chatBackground: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    // Only owner can update room settings
    if (room.ownerId.toString() !== user._id.toString()) {
      throw new Error("Only the room owner can update settings");
    }

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.isPrivate !== undefined) updates.isPrivate = args.isPrivate;
    if (args.password !== undefined) updates.password = args.password;
    if (args.maxCapacity !== undefined) updates.maxCapacity = args.maxCapacity;
    if (args.isPersistent !== undefined) updates.isPersistent = args.isPersistent;
    if (args.theme !== undefined) updates.theme = args.theme;

    await ctx.db.patch(args.roomId, updates);
    return args.roomId;
  },
});

export const transferOwnership = mutation({
  args: {
    roomId: v.id("rooms"),
    newOwnerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    if (room.ownerId.toString() !== user._id.toString()) {
      throw new Error("Only the room owner can transfer ownership");
    }

    await ctx.db.patch(args.roomId, { ownerId: args.newOwnerId });

    const newOwner = await ctx.db.get(args.newOwnerId);
    await ctx.db.insert("messages", {
      roomId: args.roomId,
      userId: user._id,
      type: "admin",
      content: `${user.username} transferred ownership to ${newOwner?.username || "Unknown"}`,
      createdAt: Date.now(),
    });

    return args.roomId;
  },
});

export const setTyping = mutation({
  args: {
    roomId: v.id("rooms"),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return;

    const member = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", user._id)
      )
      .first();

    if (member) {
      await ctx.db.patch(member._id, {
        isTyping: args.isTyping,
        lastActiveAt: Date.now(),
      });
    }
  },
});

export const updateLastActive = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return;

    const member = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", user._id)
      )
      .first();

    if (member) {
      await ctx.db.patch(member._id, { lastActiveAt: Date.now() });
    }
  },
});

export const listPublicRooms = query({
  args: {},
  handler: async (ctx) => {
    const rooms = await ctx.db
      .query("rooms")
      .filter((q) => q.eq(q.field("isPrivate"), false))
      .collect();

    return Promise.all(
      rooms.map(async (room) => {
        const owner = await ctx.db.get(room.ownerId);
        const members = await ctx.db
          .query("roomMembers")
          .withIndex("by_room", (q) => q.eq("roomId", room._id))
          .collect();

        return {
          id: room._id,
          name: room.name,
          ownerName: owner?.username || "Unknown",
          currentUsers: members.length,
          maxCapacity: room.maxCapacity,
          hasPassword: !!room.password,
          currentVideo: room.currentVideo?.name,
          createdAt: room.createdAt,
        };
      })
    );
  },
});
