import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// GROUP CRUD
// ============================================

export const createGroup = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
    avatarColor: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const groupId = await ctx.db.insert("groups", {
      name: args.name,
      description: args.description,
      ownerId: user._id,
      isPublic: args.isPublic,
      memberCount: 1,
      avatarColor: args.avatarColor,
      createdAt: Date.now(),
    });

    // Add owner as member
    await ctx.db.insert("groupMembers", {
      groupId,
      userId: user._id,
      role: "owner",
      joinedAt: Date.now(),
    });

    // Log activity
    await ctx.db.insert("userActivity", {
      userId: user._id,
      type: "joined_group",
      groupId,
      groupName: args.name,
      isActive: false,
      createdAt: Date.now(),
    });

    return groupId;
  },
});

export const updateGroup = mutation({
  args: {
    groupId: v.id("groups"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
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

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");

    // Check if user is owner or admin
    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", user._id)
      )
      .first();

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      throw new Error("Not authorized");
    }

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.isPublic !== undefined) updates.isPublic = args.isPublic;
    if (args.avatarColor !== undefined) updates.avatarColor = args.avatarColor;

    await ctx.db.patch(args.groupId, updates);
    return { success: true };
  },
});

export const deleteGroup = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");
    if (group.ownerId !== user._id) throw new Error("Only owner can delete group");

    // Delete all members
    const members = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();
    for (const member of members) {
      await ctx.db.delete(member._id);
    }

    // Delete all invites
    const invites = await ctx.db
      .query("groupInvites")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();
    for (const invite of invites) {
      await ctx.db.delete(invite._id);
    }

    await ctx.db.delete(args.groupId);
    return { success: true };
  },
});

// ============================================
// GROUP QUERIES
// ============================================

export const getMyGroups = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return [];

    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const groups = await Promise.all(
      memberships.map(async (membership) => {
        const group = await ctx.db.get(membership.groupId);
        if (!group) return null;

        const owner = await ctx.db.get(group.ownerId);

        return {
          ...group,
          myRole: membership.role,
          owner: owner
            ? { username: owner.username, avatar: owner.avatar, avatarColor: owner.avatarColor }
            : null,
          createdAt: new Date(group.createdAt).toISOString(),
        };
      })
    );

    return groups.filter(Boolean);
  },
});

export const getGroup = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) return null;

    const identity = await ctx.auth.getUserIdentity();
    let myMembership = null;

    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();

      if (user) {
        myMembership = await ctx.db
          .query("groupMembers")
          .withIndex("by_group_and_user", (q) =>
            q.eq("groupId", args.groupId).eq("userId", user._id)
          )
          .first();
      }
    }

    // Private groups require membership
    if (!group.isPublic && !myMembership) {
      return null;
    }

    const owner = await ctx.db.get(group.ownerId);

    // Get members
    const members = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    const membersWithInfo = await Promise.all(
      members.map(async (member) => {
        const memberUser = await ctx.db.get(member.userId);
        return {
          ...member,
          user: memberUser
            ? {
                _id: memberUser._id,
                username: memberUser.username,
                avatar: memberUser.avatar,
                avatarColor: memberUser.avatarColor,
              }
            : null,
          joinedAt: new Date(member.joinedAt).toISOString(),
        };
      })
    );

    return {
      ...group,
      owner: owner
        ? { username: owner.username, avatar: owner.avatar, avatarColor: owner.avatarColor }
        : null,
      members: membersWithInfo,
      myRole: myMembership?.role || null,
      isMember: !!myMembership,
      createdAt: new Date(group.createdAt).toISOString(),
    };
  },
});

export const getPublicGroups = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const groups = await ctx.db
      .query("groups")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .take(args.limit || 20);

    return Promise.all(
      groups.map(async (group) => {
        const owner = await ctx.db.get(group.ownerId);
        return {
          ...group,
          owner: owner
            ? { username: owner.username, avatar: owner.avatar, avatarColor: owner.avatarColor }
            : null,
          createdAt: new Date(group.createdAt).toISOString(),
        };
      })
    );
  },
});

// ============================================
// MEMBERSHIP
// ============================================

export const joinGroup = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");
    if (!group.isPublic) throw new Error("Cannot join private group without invite");

    // Check if already a member
    const existing = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", user._id)
      )
      .first();

    if (existing) throw new Error("Already a member");

    await ctx.db.insert("groupMembers", {
      groupId: args.groupId,
      userId: user._id,
      role: "member",
      joinedAt: Date.now(),
    });

    // Update member count
    await ctx.db.patch(args.groupId, { memberCount: group.memberCount + 1 });

    // Log activity
    await ctx.db.insert("userActivity", {
      userId: user._id,
      type: "joined_group",
      groupId: args.groupId,
      groupName: group.name,
      isActive: false,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

export const leaveGroup = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");

    if (group.ownerId === user._id) {
      throw new Error("Owner cannot leave. Transfer ownership or delete the group.");
    }

    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", user._id)
      )
      .first();

    if (!membership) throw new Error("Not a member");

    await ctx.db.delete(membership._id);
    await ctx.db.patch(args.groupId, { memberCount: Math.max(1, group.memberCount - 1) });

    return { success: true };
  },
});

export const updateMemberRole = mutation({
  args: {
    groupId: v.id("groups"),
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");

    // Only owner can change roles
    if (group.ownerId !== user._id) {
      throw new Error("Only owner can change roles");
    }

    // Cannot change owner's role
    if (args.userId === group.ownerId) {
      throw new Error("Cannot change owner's role");
    }

    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", args.userId)
      )
      .first();

    if (!membership) throw new Error("User is not a member");

    await ctx.db.patch(membership._id, { role: args.role });
    return { success: true };
  },
});

export const removeMember = mutation({
  args: {
    groupId: v.id("groups"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");

    // Check if user is owner or admin
    const myMembership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", user._id)
      )
      .first();

    if (!myMembership || (myMembership.role !== "owner" && myMembership.role !== "admin")) {
      throw new Error("Not authorized");
    }

    // Cannot remove owner
    if (args.userId === group.ownerId) {
      throw new Error("Cannot remove owner");
    }

    // Admins cannot remove other admins
    const targetMembership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", args.userId)
      )
      .first();

    if (!targetMembership) throw new Error("User is not a member");

    if (myMembership.role === "admin" && targetMembership.role === "admin") {
      throw new Error("Admins cannot remove other admins");
    }

    await ctx.db.delete(targetMembership._id);
    await ctx.db.patch(args.groupId, { memberCount: Math.max(1, group.memberCount - 1) });

    return { success: true };
  },
});

// ============================================
// INVITES
// ============================================

export const inviteToGroup = mutation({
  args: {
    groupId: v.id("groups"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("Group not found");

    // Check if user is member
    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", user._id)
      )
      .first();

    if (!membership) throw new Error("Not a member of this group");

    // Check if target is already a member
    const targetMembership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_and_user", (q) =>
        q.eq("groupId", args.groupId).eq("userId", args.userId)
      )
      .first();

    if (targetMembership) throw new Error("User is already a member");

    // Check for existing pending invite
    const existingInvites = await ctx.db
      .query("groupInvites")
      .withIndex("by_to_user_pending", (q) =>
        q.eq("toUserId", args.userId).eq("status", "pending")
      )
      .collect();

    const existingInvite = existingInvites.find((i) => i.groupId === args.groupId);
    if (existingInvite) throw new Error("Invite already sent");

    const inviteId = await ctx.db.insert("groupInvites", {
      groupId: args.groupId,
      fromUserId: user._id,
      toUserId: args.userId,
      status: "pending",
      sentAt: Date.now(),
    });

    // Create notification
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "party_invite", // Reusing type for now
      title: "Group Invite",
      message: `${user.username} invited you to join "${group.name}"`,
      read: false,
      data: { groupId: args.groupId, inviteId },
      createdAt: Date.now(),
    });

    return inviteId;
  },
});

export const respondToGroupInvite = mutation({
  args: {
    inviteId: v.id("groupInvites"),
    accept: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) throw new Error("Invite not found");
    if (invite.toUserId !== user._id) throw new Error("Not your invite");
    if (invite.status !== "pending") throw new Error("Invite already responded to");

    await ctx.db.patch(args.inviteId, {
      status: args.accept ? "accepted" : "declined",
      respondedAt: Date.now(),
    });

    if (args.accept) {
      const group = await ctx.db.get(invite.groupId);
      if (group) {
        await ctx.db.insert("groupMembers", {
          groupId: invite.groupId,
          userId: user._id,
          role: "member",
          joinedAt: Date.now(),
        });

        await ctx.db.patch(invite.groupId, { memberCount: group.memberCount + 1 });

        // Log activity
        await ctx.db.insert("userActivity", {
          userId: user._id,
          type: "joined_group",
          groupId: invite.groupId,
          groupName: group.name,
          isActive: false,
          createdAt: Date.now(),
        });
      }
    }

    return { success: true };
  },
});

export const getPendingGroupInvites = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return [];

    const invites = await ctx.db
      .query("groupInvites")
      .withIndex("by_to_user_pending", (q) =>
        q.eq("toUserId", user._id).eq("status", "pending")
      )
      .collect();

    return Promise.all(
      invites.map(async (invite) => {
        const group = await ctx.db.get(invite.groupId);
        const fromUser = await ctx.db.get(invite.fromUserId);
        return {
          ...invite,
          group: group
            ? { name: group.name, memberCount: group.memberCount, avatarColor: group.avatarColor }
            : null,
          fromUser: fromUser
            ? { username: fromUser.username, avatar: fromUser.avatar }
            : null,
          sentAt: new Date(invite.sentAt).toISOString(),
        };
      })
    );
  },
});
