import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// HELPER: Check if user has moderation permissions
// ============================================

async function checkModerationPermission(
  ctx: { db: any; auth: any },
  roomId: any,
  requiredRole: "owner" | "cohost" | "moderator" = "moderator"
) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", identity.subject))
    .first();
  if (!user) throw new Error("User not found");

  const room = await ctx.db.get(roomId);
  if (!room) throw new Error("Room not found");

  // Owner always has permission
  if (room.ownerId === user._id) {
    return { user, room, role: "owner" as const };
  }

  // Check membership and role
  const membership = await ctx.db
    .query("roomMembers")
    .withIndex("by_room_and_user", (q: any) =>
      q.eq("roomId", roomId).eq("userId", user._id)
    )
    .first();

  if (!membership) throw new Error("Not a member of this room");

  const roleHierarchy = { owner: 3, cohost: 2, moderator: 1, viewer: 0 };
  const userRole = membership.role || "viewer";
  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole];

  if (userLevel < requiredLevel) {
    throw new Error("Insufficient permissions");
  }

  return { user, room, role: userRole };
}

// ============================================
// ROOM ROLES
// ============================================

export const setMemberRole = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
    role: v.union(v.literal("viewer"), v.literal("cohost"), v.literal("moderator")),
  },
  handler: async (ctx, args) => {
    const { room } = await checkModerationPermission(ctx, args.roomId, "owner");

    // Cannot change own role
    const identity = await ctx.auth.getUserIdentity();
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity!.subject))
      .first();

    if (currentUser?._id === args.userId) {
      throw new Error("Cannot change your own role");
    }

    // Cannot set role for owner
    if (room.ownerId === args.userId) {
      throw new Error("Cannot change owner's role");
    }

    const membership = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", args.userId)
      )
      .first();

    if (!membership) throw new Error("User is not in this room");

    await ctx.db.patch(membership._id, { role: args.role });

    return { success: true };
  },
});

export const getRoomMembers = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) return [];

    const members = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    return Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        const isOwner = room.ownerId === member.userId;

        return {
          ...member,
          isOwner,
          effectiveRole: isOwner ? "owner" : member.role || "viewer",
          user: user
            ? {
                _id: user._id,
                username: user.username,
                avatar: user.avatar,
                avatarColor: user.avatarColor,
              }
            : null,
          joinedAt: new Date(member.joinedAt).toISOString(),
        };
      })
    );
  },
});

// ============================================
// KICK USER
// ============================================

export const kickUser = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user, room, role } = await checkModerationPermission(ctx, args.roomId, "moderator");

    // Cannot kick yourself
    if (user._id === args.userId) {
      throw new Error("Cannot kick yourself");
    }

    // Cannot kick owner
    if (room.ownerId === args.userId) {
      throw new Error("Cannot kick room owner");
    }

    // Check target's role - cannot kick someone with same or higher role
    const targetMembership = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", args.userId)
      )
      .first();

    if (!targetMembership) throw new Error("User is not in this room");

    const roleHierarchy = { owner: 3, cohost: 2, moderator: 1, viewer: 0 };
    const targetRole = targetMembership.role || "viewer";
    const targetLevel = roleHierarchy[targetRole as keyof typeof roleHierarchy] || 0;
    const userLevel = roleHierarchy[role as keyof typeof roleHierarchy] || 0;

    if (targetLevel >= userLevel && role !== "owner") {
      throw new Error("Cannot kick someone with same or higher role");
    }

    // Remove from room
    await ctx.db.delete(targetMembership._id);

    // Send admin message
    const targetUser = await ctx.db.get(args.userId);
    await ctx.db.insert("messages", {
      roomId: args.roomId,
      userId: user._id,
      type: "admin",
      content: `${targetUser?.username || "User"} was kicked from the room${args.reason ? `: ${args.reason}` : ""}`,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// ============================================
// BAN USER
// ============================================

export const banUser = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
    reason: v.optional(v.string()),
    durationMinutes: v.optional(v.number()), // null = permanent
  },
  handler: async (ctx, args) => {
    const { user, room, role } = await checkModerationPermission(ctx, args.roomId, "cohost");

    // Cannot ban yourself
    if (user._id === args.userId) {
      throw new Error("Cannot ban yourself");
    }

    // Cannot ban owner
    if (room.ownerId === args.userId) {
      throw new Error("Cannot ban room owner");
    }

    // Check if already banned
    const existingBan = await ctx.db
      .query("roomBans")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", args.userId)
      )
      .first();

    if (existingBan) {
      // Update existing ban
      await ctx.db.patch(existingBan._id, {
        reason: args.reason,
        expiresAt: args.durationMinutes
          ? Date.now() + args.durationMinutes * 60 * 1000
          : undefined,
        bannedAt: Date.now(),
        bannedBy: user._id,
      });
    } else {
      // Create new ban
      await ctx.db.insert("roomBans", {
        roomId: args.roomId,
        userId: args.userId,
        bannedBy: user._id,
        reason: args.reason,
        expiresAt: args.durationMinutes
          ? Date.now() + args.durationMinutes * 60 * 1000
          : undefined,
        bannedAt: Date.now(),
      });
    }

    // Remove from room if present
    const membership = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", args.userId)
      )
      .first();

    if (membership) {
      await ctx.db.delete(membership._id);
    }

    // Send admin message
    const targetUser = await ctx.db.get(args.userId);
    const durationText = args.durationMinutes
      ? ` for ${args.durationMinutes} minutes`
      : " permanently";
    await ctx.db.insert("messages", {
      roomId: args.roomId,
      userId: user._id,
      type: "admin",
      content: `${targetUser?.username || "User"} was banned${durationText}${args.reason ? `: ${args.reason}` : ""}`,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

export const unbanUser = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await checkModerationPermission(ctx, args.roomId, "cohost");

    const ban = await ctx.db
      .query("roomBans")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", args.userId)
      )
      .first();

    if (!ban) throw new Error("User is not banned");

    await ctx.db.delete(ban._id);

    return { success: true };
  },
});

export const getRoomBans = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const bans = await ctx.db
      .query("roomBans")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    return Promise.all(
      bans.map(async (ban) => {
        const user = await ctx.db.get(ban.userId);
        const bannedByUser = await ctx.db.get(ban.bannedBy);
        const isExpired = ban.expiresAt && ban.expiresAt < Date.now();

        return {
          ...ban,
          isExpired,
          user: user
            ? { _id: user._id, username: user.username, avatar: user.avatar }
            : null,
          bannedByUser: bannedByUser
            ? { username: bannedByUser.username }
            : null,
          bannedAt: new Date(ban.bannedAt).toISOString(),
          expiresAt: ban.expiresAt ? new Date(ban.expiresAt).toISOString() : null,
        };
      })
    );
  },
});

export const checkBan = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { isBanned: false };

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return { isBanned: false };

    const ban = await ctx.db
      .query("roomBans")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", user._id)
      )
      .first();

    if (!ban) return { isBanned: false };

    // Check if expired
    if (ban.expiresAt && ban.expiresAt < Date.now()) {
      // Clean up expired ban
      await ctx.db.delete(ban._id);
      return { isBanned: false };
    }

    return {
      isBanned: true,
      reason: ban.reason,
      expiresAt: ban.expiresAt ? new Date(ban.expiresAt).toISOString() : null,
    };
  },
});

// ============================================
// MUTE USER
// ============================================

export const muteUser = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
    durationMinutes: v.optional(v.number()), // null = until unmuted
  },
  handler: async (ctx, args) => {
    const { user, room } = await checkModerationPermission(ctx, args.roomId, "moderator");

    // Cannot mute yourself
    if (user._id === args.userId) {
      throw new Error("Cannot mute yourself");
    }

    // Cannot mute owner
    if (room.ownerId === args.userId) {
      throw new Error("Cannot mute room owner");
    }

    // Check existing mute
    const existingMute = await ctx.db
      .query("roomMutes")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", args.userId)
      )
      .first();

    if (existingMute) {
      await ctx.db.patch(existingMute._id, {
        expiresAt: args.durationMinutes
          ? Date.now() + args.durationMinutes * 60 * 1000
          : undefined,
        mutedAt: Date.now(),
        mutedBy: user._id,
      });
    } else {
      await ctx.db.insert("roomMutes", {
        roomId: args.roomId,
        userId: args.userId,
        mutedBy: user._id,
        expiresAt: args.durationMinutes
          ? Date.now() + args.durationMinutes * 60 * 1000
          : undefined,
        mutedAt: Date.now(),
      });
    }

    // Send admin message
    const targetUser = await ctx.db.get(args.userId);
    const durationText = args.durationMinutes
      ? ` for ${args.durationMinutes} minutes`
      : "";
    await ctx.db.insert("messages", {
      roomId: args.roomId,
      userId: user._id,
      type: "admin",
      content: `${targetUser?.username || "User"} was muted${durationText}`,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

export const unmuteUser = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { user } = await checkModerationPermission(ctx, args.roomId, "moderator");

    const mute = await ctx.db
      .query("roomMutes")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", args.userId)
      )
      .first();

    if (!mute) throw new Error("User is not muted");

    await ctx.db.delete(mute._id);

    // Send admin message
    const targetUser = await ctx.db.get(args.userId);
    await ctx.db.insert("messages", {
      roomId: args.roomId,
      userId: user._id,
      type: "admin",
      content: `${targetUser?.username || "User"} was unmuted`,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

export const checkMute = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { isMuted: false };

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return { isMuted: false };

    const mute = await ctx.db
      .query("roomMutes")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", user._id)
      )
      .first();

    if (!mute) return { isMuted: false };

    // Check if expired
    if (mute.expiresAt && mute.expiresAt < Date.now()) {
      await ctx.db.delete(mute._id);
      return { isMuted: false };
    }

    return {
      isMuted: true,
      expiresAt: mute.expiresAt ? new Date(mute.expiresAt).toISOString() : null,
    };
  },
});

// ============================================
// TRANSFER OWNERSHIP
// ============================================

export const transferOwnership = mutation({
  args: {
    roomId: v.id("rooms"),
    newOwnerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { user, room } = await checkModerationPermission(ctx, args.roomId, "owner");

    // Verify new owner is in the room
    const newOwnerMembership = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", args.newOwnerId)
      )
      .first();

    if (!newOwnerMembership) {
      throw new Error("New owner must be a member of the room");
    }

    // Transfer ownership
    await ctx.db.patch(args.roomId, { ownerId: args.newOwnerId });

    // Update roles
    await ctx.db.patch(newOwnerMembership._id, { role: "cohost" });

    // Demote old owner to cohost
    const oldOwnerMembership = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", user._id)
      )
      .first();

    if (oldOwnerMembership) {
      await ctx.db.patch(oldOwnerMembership._id, { role: "cohost" });
    }

    // Send admin message
    const newOwner = await ctx.db.get(args.newOwnerId);
    await ctx.db.insert("messages", {
      roomId: args.roomId,
      userId: user._id,
      type: "admin",
      content: `${user.username} transferred room ownership to ${newOwner?.username || "someone"}`,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});
