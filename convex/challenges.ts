import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// CHALLENGE DEFINITIONS
// ============================================

const CHALLENGE_POOL = {
  easy: [
    {
      type: "watch_time" as const,
      title: "Quick Watch",
      description: "Watch for 15 minutes",
      icon: "⏱️",
      target: 15,
      xpReward: 25,
    },
    {
      type: "send_messages" as const,
      title: "Say Hello",
      description: "Send 5 messages in chat",
      icon: "💬",
      target: 5,
      xpReward: 20,
    },
    {
      type: "send_reactions" as const,
      title: "React!",
      description: "Send 3 reactions",
      icon: "😄",
      target: 3,
      xpReward: 15,
    },
    {
      type: "join_rooms" as const,
      title: "Room Hopper",
      description: "Join a room",
      icon: "🚪",
      target: 1,
      xpReward: 20,
    },
  ],
  medium: [
    {
      type: "watch_time" as const,
      title: "Movie Time",
      description: "Watch for 45 minutes",
      icon: "🎬",
      target: 45,
      xpReward: 50,
    },
    {
      type: "watch_with_friends" as const,
      title: "Watch Together",
      description: "Watch with 2 friends",
      icon: "👥",
      target: 2,
      xpReward: 60,
    },
    {
      type: "send_messages" as const,
      title: "Chatterbox",
      description: "Send 20 messages",
      icon: "🗣️",
      target: 20,
      xpReward: 45,
    },
    {
      type: "add_to_playlist" as const,
      title: "Curator",
      description: "Add 3 videos to a playlist",
      icon: "📝",
      target: 3,
      xpReward: 40,
    },
    {
      type: "use_poll" as const,
      title: "Democracy",
      description: "Create or vote in a poll",
      icon: "🗳️",
      target: 1,
      xpReward: 35,
    },
  ],
  hard: [
    {
      type: "watch_time" as const,
      title: "Marathon Viewer",
      description: "Watch for 2 hours",
      icon: "🏆",
      target: 120,
      xpReward: 100,
    },
    {
      type: "host_party" as const,
      title: "Party Host",
      description: "Host a watch party with 3+ people",
      icon: "🎉",
      target: 3,
      xpReward: 120,
    },
    {
      type: "watch_with_friends" as const,
      title: "Squad Goals",
      description: "Watch with 5 friends",
      icon: "🌟",
      target: 5,
      xpReward: 100,
    },
    {
      type: "send_reactions" as const,
      title: "Reaction Master",
      description: "Send 25 reactions",
      icon: "🎨",
      target: 25,
      xpReward: 75,
    },
  ],
};

// Helper to get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

// Generate a unique ID for challenges
function generateChallengeId(date: string, index: number): string {
  return `${date}-${index}`;
}

// Randomly select challenges for a day
function selectDailyChallenges(date: string) {
  const challenges = [];

  // Pick 1 easy, 1 medium, 1 hard
  const easyPool = [...CHALLENGE_POOL.easy];
  const mediumPool = [...CHALLENGE_POOL.medium];
  const hardPool = [...CHALLENGE_POOL.hard];

  // Shuffle and pick
  const easy = easyPool[Math.floor(Math.random() * easyPool.length)];
  const medium = mediumPool[Math.floor(Math.random() * mediumPool.length)];
  const hard = hardPool[Math.floor(Math.random() * hardPool.length)];

  challenges.push({
    ...easy,
    id: generateChallengeId(date, 0),
    difficulty: "easy" as const,
  });
  challenges.push({
    ...medium,
    id: generateChallengeId(date, 1),
    difficulty: "medium" as const,
  });
  challenges.push({
    ...hard,
    id: generateChallengeId(date, 2),
    difficulty: "hard" as const,
  });

  return challenges;
}

// ============================================
// CHALLENGE QUERIES
// ============================================

export const getTodaysChallenges = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return null;

    const today = getTodayDate();

    // Get today's challenges
    const dailyChallenges = await ctx.db
      .query("dailyChallenges")
      .withIndex("by_date", (q) => q.eq("date", today))
      .first();

    if (!dailyChallenges) {
      // No challenges generated yet for today
      return {
        date: today,
        challenges: [],
        needsGeneration: true,
      };
    }

    // Get user's progress on today's challenges
    const userProgress = await ctx.db
      .query("userChallengeProgress")
      .withIndex("by_user_date", (q) => q.eq("userId", user._id).eq("date", today))
      .collect();

    const progressMap = new Map(userProgress.map((p) => [p.challengeId, p]));

    const challengesWithProgress = dailyChallenges.challenges.map((challenge) => {
      const progress = progressMap.get(challenge.id);

      return {
        ...challenge,
        progress: progress?.progress || 0,
        completed: progress?.completed || false,
        completedAt: progress?.completedAt,
        xpAwarded: progress?.xpAwarded || false,
      };
    });

    return {
      date: today,
      challenges: challengesWithProgress,
      needsGeneration: false,
    };
  },
});

export const getChallengeHistory = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return [];

    // Get user's challenge progress
    const allProgress = await ctx.db
      .query("userChallengeProgress")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Group by date
    const byDate = new Map<string, typeof allProgress>();
    for (const progress of allProgress) {
      const existing = byDate.get(progress.date) || [];
      existing.push(progress);
      byDate.set(progress.date, existing);
    }

    // Sort dates and take requested number
    const sortedDates = Array.from(byDate.keys()).sort((a, b) => b.localeCompare(a));
    const limitedDates = sortedDates.slice(0, args.days || 7);

    return limitedDates.map((date) => ({
      date,
      completed: byDate.get(date)?.filter((p) => p.completed).length || 0,
      total: byDate.get(date)?.length || 0,
    }));
  },
});

// ============================================
// CHALLENGE MUTATIONS
// ============================================

export const generateDailyChallenges = mutation({
  args: {},
  handler: async (ctx) => {
    const today = getTodayDate();

    // Check if already generated
    const existing = await ctx.db
      .query("dailyChallenges")
      .withIndex("by_date", (q) => q.eq("date", today))
      .first();

    if (existing) {
      return { success: true, message: "Challenges already generated" };
    }

    // Generate new challenges
    const challenges = selectDailyChallenges(today);

    await ctx.db.insert("dailyChallenges", {
      date: today,
      challenges,
      createdAt: Date.now(),
    });

    return { success: true, message: "Challenges generated" };
  },
});

export const updateChallengeProgress = mutation({
  args: {
    challengeType: v.union(
      v.literal("watch_time"),
      v.literal("watch_with_friends"),
      v.literal("send_messages"),
      v.literal("send_reactions"),
      v.literal("join_rooms"),
      v.literal("host_party"),
      v.literal("add_to_playlist"),
      v.literal("use_poll")
    ),
    incrementBy: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { success: false, message: "Not authenticated" };

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return { success: false, message: "User not found" };

    const today = getTodayDate();

    // Get today's challenges
    const dailyChallenges = await ctx.db
      .query("dailyChallenges")
      .withIndex("by_date", (q) => q.eq("date", today))
      .first();

    if (!dailyChallenges) {
      return { success: false, message: "No challenges for today" };
    }

    // Find matching challenge
    const matchingChallenge = dailyChallenges.challenges.find(
      (c) => c.type === args.challengeType
    );

    if (!matchingChallenge) {
      return { success: false, message: "No matching challenge" };
    }

    // Get or create progress record
    const existingProgress = await ctx.db
      .query("userChallengeProgress")
      .withIndex("by_user_date", (q) => q.eq("userId", user._id).eq("date", today))
      .collect();

    const progress = existingProgress.find((p) => p.challengeId === matchingChallenge.id);

    if (progress) {
      if (progress.completed) {
        return { success: true, message: "Challenge already completed" };
      }

      const newProgress = progress.progress + args.incrementBy;
      const isNowComplete = newProgress >= matchingChallenge.target;

      await ctx.db.patch(progress._id, {
        progress: newProgress,
        completed: isNowComplete,
        completedAt: isNowComplete ? Date.now() : undefined,
      });

      if (isNowComplete) {
        // Create notification
        await ctx.db.insert("notifications", {
          userId: user._id,
          type: "challenge_complete",
          title: "Challenge Complete! 🎉",
          message: `You completed "${matchingChallenge.title}" and earned ${matchingChallenge.xpReward} XP!`,
          read: false,
          data: {
            challengeId: matchingChallenge.id,
            xpReward: matchingChallenge.xpReward,
          },
          createdAt: Date.now(),
        });

        return {
          success: true,
          completed: true,
          xpReward: matchingChallenge.xpReward,
          challengeTitle: matchingChallenge.title,
        };
      }

      return { success: true, progress: newProgress, target: matchingChallenge.target };
    } else {
      // Create new progress record
      const newProgress = args.incrementBy;
      const isComplete = newProgress >= matchingChallenge.target;

      await ctx.db.insert("userChallengeProgress", {
        userId: user._id,
        date: today,
        challengeId: matchingChallenge.id,
        progress: newProgress,
        completed: isComplete,
        completedAt: isComplete ? Date.now() : undefined,
        xpAwarded: false,
      });

      if (isComplete) {
        await ctx.db.insert("notifications", {
          userId: user._id,
          type: "challenge_complete",
          title: "Challenge Complete! 🎉",
          message: `You completed "${matchingChallenge.title}" and earned ${matchingChallenge.xpReward} XP!`,
          read: false,
          data: {
            challengeId: matchingChallenge.id,
            xpReward: matchingChallenge.xpReward,
          },
          createdAt: Date.now(),
        });

        return {
          success: true,
          completed: true,
          xpReward: matchingChallenge.xpReward,
          challengeTitle: matchingChallenge.title,
        };
      }

      return { success: true, progress: newProgress, target: matchingChallenge.target };
    }
  },
});

export const claimChallengeXp = mutation({
  args: { challengeId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { success: false, message: "Not authenticated" };

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return { success: false, message: "User not found" };

    // Find the progress record
    const progressRecords = await ctx.db
      .query("userChallengeProgress")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const progress = progressRecords.find((p) => p.challengeId === args.challengeId);

    if (!progress) {
      return { success: false, message: "Progress not found" };
    }

    if (!progress.completed) {
      return { success: false, message: "Challenge not completed" };
    }

    if (progress.xpAwarded) {
      return { success: false, message: "XP already claimed" };
    }

    // Get challenge info to know XP amount
    const dailyChallenges = await ctx.db
      .query("dailyChallenges")
      .withIndex("by_date", (q) => q.eq("date", progress.date))
      .first();

    const challenge = dailyChallenges?.challenges.find((c) => c.id === args.challengeId);
    if (!challenge) {
      return { success: false, message: "Challenge not found" };
    }

    // Mark XP as awarded
    await ctx.db.patch(progress._id, { xpAwarded: true });

    // The actual XP award will be handled by the levels system
    return {
      success: true,
      xpAmount: challenge.xpReward,
      type: "challenge" as const,
      reason: `Completed challenge: ${challenge.title}`,
    };
  },
});
