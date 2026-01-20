import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const videoValidator = v.object({
  videoId: v.string(),
  url: v.string(),
  name: v.string(),
  channel: v.optional(v.string()),
  img: v.optional(v.string()),
});

export const createScheduledParty = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    scheduledFor: v.number(),
    videos: v.array(videoValidator),
    isRecurring: v.boolean(),
    recurrencePattern: v.optional(
      v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"))
    ),
    invitedUserIds: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const partyId = await ctx.db.insert("scheduledParties", {
      name: args.name,
      description: args.description,
      createdBy: user._id,
      scheduledFor: args.scheduledFor,
      roomId: undefined,
      videos: args.videos,
      isRecurring: args.isRecurring,
      recurrencePattern: args.recurrencePattern,
      createdAt: Date.now(),
    });

    // Create invitations for invited users
    if (args.invitedUserIds) {
      for (const invitedUserId of args.invitedUserIds) {
        await ctx.db.insert("partyInvitations", {
          partyId,
          userId: invitedUserId,
          status: "pending",
          invitedAt: Date.now(),
        });

        // Send notification
        await ctx.db.insert("notifications", {
          userId: invitedUserId,
          type: "party_invite",
          title: "Watch Party Invitation",
          message: `${user.username} invited you to "${args.name}"`,
          read: false,
          data: { partyId, partyName: args.name, fromUserId: user._id },
          createdAt: Date.now(),
        });
      }
    }

    return partyId;
  },
});

export const getScheduledParties = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return [];

    // Get parties created by user
    const myParties = await ctx.db
      .query("scheduledParties")
      .withIndex("by_creator", (q) => q.eq("createdBy", user._id))
      .collect();

    // Get parties user is invited to
    const invitations = await ctx.db
      .query("partyInvitations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const invitedPartyIds = invitations.map((inv) => inv.partyId);
    const invitedParties = await Promise.all(
      invitedPartyIds.map((id) => ctx.db.get(id))
    );

    // Combine and deduplicate
    const allParties = [
      ...myParties,
      ...invitedParties.filter(Boolean),
    ] as typeof myParties;

    const uniqueParties = Array.from(
      new Map(allParties.map((p) => [p._id.toString(), p])).values()
    );

    return Promise.all(
      uniqueParties.map(async (party) => {
        const creator = await ctx.db.get(party.createdBy);
        const partyInvitations = await ctx.db
          .query("partyInvitations")
          .withIndex("by_party", (q) => q.eq("partyId", party._id))
          .collect();

        const invitedUsers = await Promise.all(
          partyInvitations.map(async (inv) => {
            const invUser = await ctx.db.get(inv.userId);
            return {
              id: inv.userId,
              username: invUser?.username || "Unknown",
              status: inv.status,
            };
          })
        );

        const acceptedUsers = invitedUsers.filter(
          (u) => u.status === "accepted"
        );

        return {
          id: party._id,
          name: party.name,
          description: party.description,
          scheduledFor: new Date(party.scheduledFor).toISOString(),
          createdBy: party.createdBy,
          creatorName: creator?.username || "Unknown",
          roomId: party.roomId,
          videos: party.videos,
          isRecurring: party.isRecurring,
          recurrencePattern: party.recurrencePattern,
          invitedUsers: invitedUsers.map((u) => u.id.toString()),
          acceptedUsers: acceptedUsers.map((u) => u.id.toString()),
          isCreator: party.createdBy.toString() === user._id.toString(),
        };
      })
    );
  },
});

export const getUpcomingParties = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return [];

    const now = Date.now();

    // Get all upcoming parties
    const upcomingParties = await ctx.db
      .query("scheduledParties")
      .withIndex("by_scheduled_time", (q) => q.gt("scheduledFor", now))
      .collect();

    // Filter to only include parties user created or is invited to
    const relevantParties = await Promise.all(
      upcomingParties.map(async (party) => {
        if (party.createdBy.toString() === user._id.toString()) {
          return party;
        }

        const invitation = await ctx.db
          .query("partyInvitations")
          .withIndex("by_party", (q) => q.eq("partyId", party._id))
          .filter((q) => q.eq(q.field("userId"), user._id))
          .first();

        return invitation ? party : null;
      })
    );

    const filtered = relevantParties.filter(Boolean) as typeof upcomingParties;

    return Promise.all(
      filtered.slice(0, 10).map(async (party) => {
        const creator = await ctx.db.get(party.createdBy);
        return {
          id: party._id,
          name: party.name,
          scheduledFor: new Date(party.scheduledFor).toISOString(),
          creatorName: creator?.username || "Unknown",
          videoCount: party.videos.length,
        };
      })
    );
  },
});

export const acceptPartyInvitation = mutation({
  args: { partyId: v.id("scheduledParties") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const invitation = await ctx.db
      .query("partyInvitations")
      .withIndex("by_party", (q) => q.eq("partyId", args.partyId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();

    if (!invitation) throw new Error("Invitation not found");

    await ctx.db.patch(invitation._id, {
      status: "accepted",
      respondedAt: Date.now(),
    });

    return { success: true };
  },
});

export const declinePartyInvitation = mutation({
  args: { partyId: v.id("scheduledParties") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const invitation = await ctx.db
      .query("partyInvitations")
      .withIndex("by_party", (q) => q.eq("partyId", args.partyId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();

    if (!invitation) throw new Error("Invitation not found");

    await ctx.db.patch(invitation._id, {
      status: "declined",
      respondedAt: Date.now(),
    });

    return { success: true };
  },
});

export const updateScheduledParty = mutation({
  args: {
    partyId: v.id("scheduledParties"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    scheduledFor: v.optional(v.number()),
    videos: v.optional(v.array(videoValidator)),
    isRecurring: v.optional(v.boolean()),
    recurrencePattern: v.optional(
      v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"))
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

    const party = await ctx.db.get(args.partyId);
    if (!party) throw new Error("Party not found");

    if (party.createdBy.toString() !== user._id.toString()) {
      throw new Error("Only the creator can update this party");
    }

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.scheduledFor !== undefined) updates.scheduledFor = args.scheduledFor;
    if (args.videos !== undefined) updates.videos = args.videos;
    if (args.isRecurring !== undefined) updates.isRecurring = args.isRecurring;
    if (args.recurrencePattern !== undefined)
      updates.recurrencePattern = args.recurrencePattern;

    await ctx.db.patch(args.partyId, updates);

    return { success: true };
  },
});

export const deleteScheduledParty = mutation({
  args: { partyId: v.id("scheduledParties") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const party = await ctx.db.get(args.partyId);
    if (!party) throw new Error("Party not found");

    if (party.createdBy.toString() !== user._id.toString()) {
      throw new Error("Only the creator can delete this party");
    }

    // Delete all invitations
    const invitations = await ctx.db
      .query("partyInvitations")
      .withIndex("by_party", (q) => q.eq("partyId", args.partyId))
      .collect();

    for (const invitation of invitations) {
      await ctx.db.delete(invitation._id);
    }

    await ctx.db.delete(args.partyId);

    return { success: true };
  },
});

export const inviteToParty = mutation({
  args: {
    partyId: v.id("scheduledParties"),
    userIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const party = await ctx.db.get(args.partyId);
    if (!party) throw new Error("Party not found");

    if (party.createdBy.toString() !== user._id.toString()) {
      throw new Error("Only the creator can invite users");
    }

    for (const userId of args.userIds) {
      // Check if already invited
      const existingInvitation = await ctx.db
        .query("partyInvitations")
        .withIndex("by_party", (q) => q.eq("partyId", args.partyId))
        .filter((q) => q.eq(q.field("userId"), userId))
        .first();

      if (!existingInvitation) {
        await ctx.db.insert("partyInvitations", {
          partyId: args.partyId,
          userId,
          status: "pending",
          invitedAt: Date.now(),
        });

        // Send notification
        await ctx.db.insert("notifications", {
          userId,
          type: "party_invite",
          title: "Watch Party Invitation",
          message: `${user.username} invited you to "${party.name}"`,
          read: false,
          data: { partyId: args.partyId, partyName: party.name, fromUserId: user._id },
          createdAt: Date.now(),
        });
      }
    }

    return { success: true };
  },
});
