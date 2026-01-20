import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const sendMessage = mutation({
  args: {
    roomId: v.id("rooms"),
    type: v.union(v.literal("chat"), v.literal("gif")),
    content: v.string(),
    gifUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const messageId = await ctx.db.insert("messages", {
      roomId: args.roomId,
      userId: user._id,
      type: args.type,
      content: args.content,
      gifUrl: args.gifUrl,
      createdAt: Date.now(),
    });

    // Update user stats
    await ctx.db.patch(user._id, {
      stats: {
        ...user.stats,
        messagesSent: user.stats.messagesSent + 1,
      },
    });

    // Clear typing indicator
    const member = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", user._id)
      )
      .first();

    if (member && member.isTyping) {
      await ctx.db.patch(member._id, { isTyping: false });
    }

    return messageId;
  },
});

export const getMessages = query({
  args: {
    roomId: v.id("rooms"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_room_and_time", (q) => q.eq("roomId", args.roomId))
      .order("desc")
      .take(args.limit || 100);

    // Get user details for each message
    const messagesWithUsers = await Promise.all(
      messages.reverse().map(async (message) => {
        const user = await ctx.db.get(message.userId);
        return {
          id: message._id,
          type: message.type,
          content: message.content,
          gifUrl: message.gifUrl,
          created_at: new Date(message.createdAt).toISOString(),
          userId: message.userId,
          username: user?.username || "Unknown",
          avatar: user?.avatar,
          avatarColor: user?.avatarColor || "#8B5CF6",
        };
      })
    );

    return messagesWithUsers;
  },
});

export const sendReaction = mutation({
  args: {
    roomId: v.id("rooms"),
    emoji: v.string(),
    x: v.number(),
    y: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const reactionId = await ctx.db.insert("reactions", {
      roomId: args.roomId,
      userId: user._id,
      emoji: args.emoji,
      x: args.x,
      y: args.y,
      createdAt: Date.now(),
    });

    // Update user stats
    await ctx.db.patch(user._id, {
      stats: {
        ...user.stats,
        reactionsGiven: user.stats.reactionsGiven + 1,
      },
    });

    return reactionId;
  },
});

export const getReactions = query({
  args: {
    roomId: v.id("rooms"),
    since: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const cutoff = args.since || Date.now() - 5000; // Default to last 5 seconds

    const reactions = await ctx.db
      .query("reactions")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .filter((q) => q.gt(q.field("createdAt"), cutoff))
      .collect();

    return Promise.all(
      reactions.map(async (reaction) => {
        const user = await ctx.db.get(reaction.userId);
        return {
          id: reaction._id,
          emoji: reaction.emoji,
          userId: reaction.userId,
          username: user?.username || "Unknown",
          x: reaction.x,
          y: reaction.y,
          timestamp: reaction.createdAt,
        };
      })
    );
  },
});

// Clean up old reactions (can be called by a cron job)
export const cleanupOldReactions = mutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 10000; // 10 seconds ago

    const oldReactions = await ctx.db
      .query("reactions")
      .withIndex("by_created", (q) => q.lt("createdAt", cutoff))
      .collect();

    for (const reaction of oldReactions) {
      await ctx.db.delete(reaction._id);
    }

    return oldReactions.length;
  },
});
