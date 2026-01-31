import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// EVENT QUERIES
// ============================================

export const getActiveEvents = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const events = await ctx.db
      .query("events")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    // Filter to currently running or upcoming events
    const relevantEvents = events.filter(
      (e) => e.endsAt >= now // Event hasn't ended yet
    );

    // Sort by start time
    relevantEvents.sort((a, b) => a.startsAt - b.startsAt);

    // Add participant counts
    return Promise.all(
      relevantEvents.map(async (event) => {
        const participants = await ctx.db
          .query("eventParticipants")
          .withIndex("by_event", (q) => q.eq("eventId", event._id))
          .collect();

        const isActive = event.startsAt <= now && event.endsAt >= now;
        const isUpcoming = event.startsAt > now;
        const timeUntilStart = isUpcoming ? event.startsAt - now : 0;
        const timeUntilEnd = isActive ? event.endsAt - now : 0;

        return {
          ...event,
          participantCount: participants.length,
          totalWatchTime: participants.reduce((sum, p) => sum + p.watchTime, 0),
          totalContribution: participants.reduce((sum, p) => sum + p.contribution, 0),
          isActive,
          isUpcoming,
          timeUntilStart,
          timeUntilEnd,
        };
      })
    );
  },
});

export const getEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) return null;

    const participants = await ctx.db
      .query("eventParticipants")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    // Get top participants
    const topParticipants = await Promise.all(
      participants
        .sort((a, b) => b.contribution - a.contribution)
        .slice(0, 10)
        .map(async (p) => {
          const user = await ctx.db.get(p.userId);

          return {
            ...p,
            user: user
              ? {
                  _id: user._id,
                  username: user.username,
                  avatar: user.avatar,
                  avatarColor: user.avatarColor,
                }
              : null,
          };
        })
    );

    const now = Date.now();

    return {
      ...event,
      participantCount: participants.length,
      totalWatchTime: participants.reduce((sum, p) => sum + p.watchTime, 0),
      totalContribution: participants.reduce((sum, p) => sum + p.contribution, 0),
      topParticipants,
      isActive: event.startsAt <= now && event.endsAt >= now,
      isUpcoming: event.startsAt > now,
      hasEnded: event.endsAt < now,
    };
  },
});

export const getMyEventParticipation = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return null;

    const participation = await ctx.db
      .query("eventParticipants")
      .withIndex("by_event_user", (q) => q.eq("eventId", args.eventId).eq("userId", user._id))
      .first();

    return participation;
  },
});

export const getUpcomingEvents = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const oneWeekFromNow = now + 7 * 24 * 60 * 60 * 1000;

    const events = await ctx.db
      .query("events")
      .withIndex("by_start", (q) => q.gt("startsAt", now))
      .collect();

    // Filter to events starting within the next week
    const upcomingEvents = events
      .filter((e) => e.startsAt <= oneWeekFromNow && e.isActive)
      .sort((a, b) => a.startsAt - b.startsAt)
      .slice(0, args.limit || 5);

    return upcomingEvents.map((e) => ({
      ...e,
      timeUntilStart: e.startsAt - now,
    }));
  },
});

// ============================================
// EVENT MUTATIONS
// ============================================

export const joinEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    if (!event.isActive) throw new Error("Event is not active");

    const now = Date.now();
    if (event.endsAt < now) throw new Error("Event has ended");

    // Check if already participating
    const existing = await ctx.db
      .query("eventParticipants")
      .withIndex("by_event_user", (q) => q.eq("eventId", args.eventId).eq("userId", user._id))
      .first();

    if (existing) {
      return { success: true, message: "Already participating" };
    }

    await ctx.db.insert("eventParticipants", {
      eventId: args.eventId,
      userId: user._id,
      joinedAt: Date.now(),
      watchTime: 0,
      videosWatched: 0,
      contribution: 0,
      xpEarned: 0,
      badgeAwarded: false,
    });

    return { success: true };
  },
});

export const updateEventProgress = mutation({
  args: {
    eventId: v.id("events"),
    watchTimeIncrement: v.optional(v.number()),
    videosWatchedIncrement: v.optional(v.number()),
    contributionIncrement: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { success: false };

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return { success: false };

    const event = await ctx.db.get(args.eventId);
    if (!event || !event.isActive) return { success: false };

    const now = Date.now();
    if (event.startsAt > now || event.endsAt < now) {
      return { success: false, message: "Event not currently active" };
    }

    const participation = await ctx.db
      .query("eventParticipants")
      .withIndex("by_event_user", (q) => q.eq("eventId", args.eventId).eq("userId", user._id))
      .first();

    if (!participation) {
      return { success: false, message: "Not participating in event" };
    }

    // Calculate XP with event multiplier
    const xpMultiplier = event.xpMultiplier || 1;
    let xpGained = 0;
    if (args.watchTimeIncrement) {
      xpGained += Math.floor((args.watchTimeIncrement / 60) * xpMultiplier); // 1 XP per minute * multiplier
    }

    await ctx.db.patch(participation._id, {
      watchTime: participation.watchTime + (args.watchTimeIncrement || 0),
      videosWatched: participation.videosWatched + (args.videosWatchedIncrement || 0),
      contribution: participation.contribution + (args.contributionIncrement || 0),
      xpEarned: participation.xpEarned + xpGained,
    });

    // Update community goal if present
    if (event.communityGoal && args.contributionIncrement) {
      const newCurrent = event.communityGoal.current + args.contributionIncrement;
      await ctx.db.patch(args.eventId, {
        communityGoal: {
          ...event.communityGoal,
          current: newCurrent,
        },
      });
    }

    return { success: true, xpGained };
  },
});

export const createEvent = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    type: v.union(
      v.literal("community_watch"),
      v.literal("marathon"),
      v.literal("challenge_event"),
      v.literal("seasonal"),
      v.literal("special")
    ),
    startsAt: v.number(),
    endsAt: v.number(),
    xpMultiplier: v.optional(v.number()),
    specialBadgeId: v.optional(v.string()),
    featuredVideos: v.optional(
      v.array(
        v.object({
          videoId: v.string(),
          url: v.string(),
          name: v.string(),
          channel: v.optional(v.string()),
          img: v.optional(v.string()),
        })
      )
    ),
    communityGoal: v.optional(
      v.object({
        type: v.string(),
        target: v.number(),
      })
    ),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const eventId = await ctx.db.insert("events", {
      name: args.name,
      description: args.description,
      type: args.type,
      startsAt: args.startsAt,
      endsAt: args.endsAt,
      xpMultiplier: args.xpMultiplier,
      specialBadgeId: args.specialBadgeId,
      featuredVideos: args.featuredVideos,
      communityGoal: args.communityGoal
        ? { ...args.communityGoal, current: 0 }
        : undefined,
      color: args.color,
      createdBy: user._id,
      isActive: true,
      createdAt: Date.now(),
    });

    return { success: true, eventId };
  },
});

export const endEvent = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    // Award badges to participants if applicable
    if (event.specialBadgeId) {
      const participants = await ctx.db
        .query("eventParticipants")
        .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
        .collect();

      for (const participant of participants) {
        if (!participant.badgeAwarded && participant.watchTime > 0) {
          // Award event badge
          await ctx.db.insert("badges", {
            userId: participant.userId,
            name: event.name,
            description: `Participated in ${event.name} event`,
            icon: "🎪",
            category: "special",
            earnedAt: Date.now(),
          });

          await ctx.db.patch(participant._id, { badgeAwarded: true });

          // Notify user
          await ctx.db.insert("notifications", {
            userId: participant.userId,
            type: "badge_earned",
            title: "Event Badge Earned! 🎪",
            message: `You earned a badge for participating in ${event.name}!`,
            read: false,
            data: { eventId: args.eventId, badgeName: event.name },
            createdAt: Date.now(),
          });
        }
      }
    }

    await ctx.db.patch(args.eventId, { isActive: false });

    return { success: true };
  },
});
