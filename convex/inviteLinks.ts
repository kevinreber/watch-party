import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Generate a short unique code
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excluding confusing characters
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return code;
}

// ============================================
// INVITE LINK QUERIES
// ============================================

export const getInviteLink = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const inviteLink = await ctx.db
      .query("inviteLinks")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();

    if (!inviteLink) return null;

    // Check if expired
    if (inviteLink.expiresAt && inviteLink.expiresAt < Date.now()) {
      return { ...inviteLink, isExpired: true, isValid: false };
    }

    // Check if max uses reached
    if (inviteLink.maxUses && inviteLink.useCount >= inviteLink.maxUses) {
      return { ...inviteLink, isMaxUsesReached: true, isValid: false };
    }

    // Check if active
    if (!inviteLink.isActive) {
      return { ...inviteLink, isDeactivated: true, isValid: false };
    }

    // Get room info
    const room = await ctx.db.get(inviteLink.roomId);
    if (!room) {
      return { ...inviteLink, roomDeleted: true, isValid: false };
    }

    // Get creator info
    const creator = await ctx.db.get(inviteLink.createdBy);

    return {
      ...inviteLink,
      isValid: true,
      room: {
        _id: room._id,
        name: room.name,
        currentVideo: room.currentVideo,
      },
      creator: creator
        ? {
            _id: creator._id,
            username: creator.username,
            avatar: creator.avatar,
            avatarColor: creator.avatarColor,
          }
        : null,
    };
  },
});

export const getRoomInviteLinks = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return [];

    // Check if user is room owner or has permission
    const room = await ctx.db.get(args.roomId);
    if (!room) return [];

    // Only room owner can see all invite links
    if (room.ownerId !== user._id) {
      // Check if user is a cohost/moderator
      const membership = await ctx.db
        .query("roomMembers")
        .withIndex("by_room_and_user", (q) => q.eq("roomId", args.roomId).eq("userId", user._id))
        .first();

      if (!membership || (membership.role !== "cohost" && membership.role !== "moderator")) {
        return [];
      }
    }

    const inviteLinks = await ctx.db
      .query("inviteLinks")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    return inviteLinks.map((link) => ({
      ...link,
      isExpired: link.expiresAt ? link.expiresAt < Date.now() : false,
      isMaxUsesReached: link.maxUses ? link.useCount >= link.maxUses : false,
    }));
  },
});

export const getMyInviteLinks = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return [];

    const inviteLinks = await ctx.db
      .query("inviteLinks")
      .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
      .collect();

    // Add room info
    return Promise.all(
      inviteLinks.map(async (link) => {
        const room = await ctx.db.get(link.roomId);

        return {
          ...link,
          room: room ? { _id: room._id, name: room.name } : null,
          isExpired: link.expiresAt ? link.expiresAt < Date.now() : false,
          isMaxUsesReached: link.maxUses ? link.useCount >= link.maxUses : false,
        };
      })
    );
  },
});

// ============================================
// INVITE LINK MUTATIONS
// ============================================

export const createInviteLink = mutation({
  args: {
    roomId: v.id("rooms"),
    maxUses: v.optional(v.number()),
    expiresInHours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    // Check room exists
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    // Check permission (owner, cohost, or moderator)
    if (room.ownerId !== user._id) {
      const membership = await ctx.db
        .query("roomMembers")
        .withIndex("by_room_and_user", (q) => q.eq("roomId", args.roomId).eq("userId", user._id))
        .first();

      if (!membership || (membership.role !== "cohost" && membership.role !== "moderator")) {
        throw new Error("Not authorized to create invite links");
      }
    }

    // Generate unique code
    let code = generateInviteCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await ctx.db
        .query("inviteLinks")
        .withIndex("by_code", (q) => q.eq("code", code))
        .first();

      if (!existing) break;
      code = generateInviteCode();
      attempts++;
    }

    const expiresAt = args.expiresInHours
      ? Date.now() + args.expiresInHours * 60 * 60 * 1000
      : undefined;

    const inviteLinkId = await ctx.db.insert("inviteLinks", {
      roomId: args.roomId,
      createdBy: user._id,
      code,
      maxUses: args.maxUses,
      expiresAt,
      useCount: 0,
      isActive: true,
      createdAt: Date.now(),
    });

    return {
      success: true,
      inviteLinkId,
      code,
      expiresAt,
    };
  },
});

export const useInviteLink = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const inviteLink = await ctx.db
      .query("inviteLinks")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();

    if (!inviteLink) throw new Error("Invalid invite code");

    // Validate invite link
    if (!inviteLink.isActive) throw new Error("Invite link has been deactivated");
    if (inviteLink.expiresAt && inviteLink.expiresAt < Date.now()) {
      throw new Error("Invite link has expired");
    }
    if (inviteLink.maxUses && inviteLink.useCount >= inviteLink.maxUses) {
      throw new Error("Invite link has reached maximum uses");
    }

    // Check room exists
    const room = await ctx.db.get(inviteLink.roomId);
    if (!room) throw new Error("Room no longer exists");

    // Check if user is banned from room
    const ban = await ctx.db
      .query("roomBans")
      .withIndex("by_room_and_user", (q) => q.eq("roomId", room._id).eq("userId", user._id))
      .first();

    if (ban) {
      if (!ban.expiresAt || ban.expiresAt > Date.now()) {
        throw new Error("You are banned from this room");
      }
    }

    // Check if already a member
    const existingMembership = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_and_user", (q) => q.eq("roomId", room._id).eq("userId", user._id))
      .first();

    if (!existingMembership) {
      // Add user to room
      await ctx.db.insert("roomMembers", {
        roomId: room._id,
        userId: user._id,
        joinedAt: Date.now(),
        lastActiveAt: Date.now(),
        isTyping: false,
        role: "viewer",
      });
    }

    // Log the invite use
    await ctx.db.insert("inviteLinkUses", {
      inviteLinkId: inviteLink._id,
      userId: user._id,
      usedAt: Date.now(),
    });

    // Increment use count
    await ctx.db.patch(inviteLink._id, {
      useCount: inviteLink.useCount + 1,
    });

    return {
      success: true,
      roomId: room._id,
      roomName: room.name,
    };
  },
});

export const deactivateInviteLink = mutation({
  args: { inviteLinkId: v.id("inviteLinks") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const inviteLink = await ctx.db.get(args.inviteLinkId);
    if (!inviteLink) throw new Error("Invite link not found");

    // Check permission
    const room = await ctx.db.get(inviteLink.roomId);
    if (!room) throw new Error("Room not found");

    if (room.ownerId !== user._id && inviteLink.createdBy !== user._id) {
      throw new Error("Not authorized to deactivate this invite link");
    }

    await ctx.db.patch(args.inviteLinkId, { isActive: false });

    return { success: true };
  },
});

export const deleteInviteLink = mutation({
  args: { inviteLinkId: v.id("inviteLinks") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const inviteLink = await ctx.db.get(args.inviteLinkId);
    if (!inviteLink) throw new Error("Invite link not found");

    // Check permission
    const room = await ctx.db.get(inviteLink.roomId);
    if (!room) throw new Error("Room not found");

    if (room.ownerId !== user._id && inviteLink.createdBy !== user._id) {
      throw new Error("Not authorized to delete this invite link");
    }

    // Delete associated uses
    const uses = await ctx.db
      .query("inviteLinkUses")
      .withIndex("by_link", (q) => q.eq("inviteLinkId", args.inviteLinkId))
      .collect();

    for (const use of uses) {
      await ctx.db.delete(use._id);
    }

    await ctx.db.delete(args.inviteLinkId);

    return { success: true };
  },
});
