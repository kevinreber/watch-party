import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createPoll = mutation({
  args: {
    roomId: v.id("rooms"),
    question: v.string(),
    options: v.array(v.string()),
    endsAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    // End any existing active polls in this room
    const activePolls = await ctx.db
      .query("polls")
      .withIndex("by_room_active", (q) =>
        q.eq("roomId", args.roomId).eq("isActive", true)
      )
      .collect();

    for (const poll of activePolls) {
      await ctx.db.patch(poll._id, { isActive: false });
    }

    const pollId = await ctx.db.insert("polls", {
      roomId: args.roomId,
      createdBy: user._id,
      question: args.question,
      options: args.options.map((text, index) => ({
        id: `option-${index}`,
        text,
        votes: 0,
      })),
      isActive: true,
      endsAt: args.endsAt,
      createdAt: Date.now(),
    });

    return pollId;
  },
});

export const vote = mutation({
  args: {
    pollId: v.id("polls"),
    optionId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const poll = await ctx.db.get(args.pollId);
    if (!poll) throw new Error("Poll not found");
    if (!poll.isActive) throw new Error("Poll is no longer active");

    // Check if user already voted
    const existingVote = await ctx.db
      .query("pollVotes")
      .withIndex("by_poll_and_user", (q) =>
        q.eq("pollId", args.pollId).eq("userId", user._id)
      )
      .first();

    if (existingVote) {
      // Change vote
      const oldOptionId = existingVote.optionId;

      // Update the old option's vote count
      const updatedOptions = poll.options.map((opt) => {
        if (opt.id === oldOptionId) {
          return { ...opt, votes: Math.max(0, opt.votes - 1) };
        }
        if (opt.id === args.optionId) {
          return { ...opt, votes: opt.votes + 1 };
        }
        return opt;
      });

      await ctx.db.patch(args.pollId, { options: updatedOptions });
      await ctx.db.patch(existingVote._id, {
        optionId: args.optionId,
        votedAt: Date.now(),
      });

      return { changed: true };
    }

    // New vote
    await ctx.db.insert("pollVotes", {
      pollId: args.pollId,
      optionId: args.optionId,
      userId: user._id,
      votedAt: Date.now(),
    });

    // Update option vote count
    const updatedOptions = poll.options.map((opt) => {
      if (opt.id === args.optionId) {
        return { ...opt, votes: opt.votes + 1 };
      }
      return opt;
    });

    await ctx.db.patch(args.pollId, { options: updatedOptions });

    return { changed: false };
  },
});

export const endPoll = mutation({
  args: { pollId: v.id("polls") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const poll = await ctx.db.get(args.pollId);
    if (!poll) throw new Error("Poll not found");

    // Only creator can end poll
    if (poll.createdBy.toString() !== user._id.toString()) {
      throw new Error("Only the poll creator can end the poll");
    }

    await ctx.db.patch(args.pollId, { isActive: false });

    return { success: true };
  },
});

export const deletePoll = mutation({
  args: { pollId: v.id("polls") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const poll = await ctx.db.get(args.pollId);
    if (!poll) throw new Error("Poll not found");

    // Only creator can delete poll
    if (poll.createdBy.toString() !== user._id.toString()) {
      throw new Error("Only the poll creator can delete the poll");
    }

    // Delete all votes
    const votes = await ctx.db
      .query("pollVotes")
      .withIndex("by_poll", (q) => q.eq("pollId", args.pollId))
      .collect();

    for (const vote of votes) {
      await ctx.db.delete(vote._id);
    }

    await ctx.db.delete(args.pollId);

    return { success: true };
  },
});

export const getPolls = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const polls = await ctx.db
      .query("polls")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .order("desc")
      .collect();

    return Promise.all(
      polls.map(async (poll) => {
        const creator = await ctx.db.get(poll.createdBy);
        const votes = await ctx.db
          .query("pollVotes")
          .withIndex("by_poll", (q) => q.eq("pollId", poll._id))
          .collect();

        const totalVotes = votes.length;

        // Get voters for each option
        const optionsWithVoters = poll.options.map((opt) => ({
          ...opt,
          voters: votes
            .filter((v) => v.optionId === opt.id)
            .map((v) => v.userId.toString()),
        }));

        return {
          id: poll._id,
          question: poll.question,
          options: optionsWithVoters,
          createdBy: poll.createdBy,
          creatorName: creator?.username || "Unknown",
          createdAt: new Date(poll.createdAt).toISOString(),
          endsAt: poll.endsAt ? new Date(poll.endsAt).toISOString() : undefined,
          isActive: poll.isActive,
          totalVotes,
        };
      })
    );
  },
});

export const getActivePoll = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const poll = await ctx.db
      .query("polls")
      .withIndex("by_room_active", (q) =>
        q.eq("roomId", args.roomId).eq("isActive", true)
      )
      .first();

    if (!poll) return null;

    const creator = await ctx.db.get(poll.createdBy);
    const votes = await ctx.db
      .query("pollVotes")
      .withIndex("by_poll", (q) => q.eq("pollId", poll._id))
      .collect();

    const totalVotes = votes.length;

    const optionsWithVoters = poll.options.map((opt) => ({
      ...opt,
      voters: votes
        .filter((v) => v.optionId === opt.id)
        .map((v) => v.userId.toString()),
    }));

    return {
      id: poll._id,
      question: poll.question,
      options: optionsWithVoters,
      createdBy: poll.createdBy,
      creatorName: creator?.username || "Unknown",
      createdAt: new Date(poll.createdAt).toISOString(),
      endsAt: poll.endsAt ? new Date(poll.endsAt).toISOString() : undefined,
      isActive: poll.isActive,
      totalVotes,
    };
  },
});

export const getUserVote = query({
  args: { pollId: v.id("polls") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return null;

    const vote = await ctx.db
      .query("pollVotes")
      .withIndex("by_poll_and_user", (q) =>
        q.eq("pollId", args.pollId).eq("userId", user._id)
      )
      .first();

    return vote ? vote.optionId : null;
  },
});

// Create a "What to watch next?" poll from the video queue
export const createWatchNextPoll = mutation({
  args: {
    roomId: v.id("rooms"),
    videoOptions: v.array(
      v.object({
        videoId: v.string(),
        name: v.string(),
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

    // End any existing active polls
    const activePolls = await ctx.db
      .query("polls")
      .withIndex("by_room_active", (q) =>
        q.eq("roomId", args.roomId).eq("isActive", true)
      )
      .collect();

    for (const poll of activePolls) {
      await ctx.db.patch(poll._id, { isActive: false });
    }

    const pollId = await ctx.db.insert("polls", {
      roomId: args.roomId,
      createdBy: user._id,
      question: "What should we watch next?",
      options: args.videoOptions.map((video) => ({
        id: video.videoId,
        text: video.name,
        votes: 0,
      })),
      isActive: true,
      endsAt: Date.now() + 60000, // 1 minute
      createdAt: Date.now(),
    });

    return pollId;
  },
});
