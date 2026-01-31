import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// LEVEL DEFINITIONS
// ============================================

export const LEVEL_CONFIG = {
  // XP required per level (cumulative)
  xpPerLevel: [
    0, // Level 1 (starting)
    100, // Level 2
    250, // Level 3
    500, // Level 4
    800, // Level 5
    1200, // Level 6
    1700, // Level 7
    2300, // Level 8
    3000, // Level 9
    3800, // Level 10
    4700, // Level 11
    5700, // Level 12
    6800, // Level 13
    8000, // Level 14
    9300, // Level 15
    10700, // Level 16
    12200, // Level 17
    13800, // Level 18
    15500, // Level 19
    17300, // Level 20
    19200, // Level 21
    21200, // Level 22
    23300, // Level 23
    25500, // Level 24
    27800, // Level 25
    30200, // Level 26
    32700, // Level 27
    35300, // Level 28
    38000, // Level 29
    40800, // Level 30
    // Beyond 30, each level requires 3000 more XP
  ],
  // Titles for level ranges
  titles: [
    { minLevel: 1, maxLevel: 5, title: "Newbie" },
    { minLevel: 6, maxLevel: 10, title: "Regular" },
    { minLevel: 11, maxLevel: 15, title: "Enthusiast" },
    { minLevel: 16, maxLevel: 20, title: "Dedicated" },
    { minLevel: 21, maxLevel: 25, title: "Veteran" },
    { minLevel: 26, maxLevel: 30, title: "Expert" },
    { minLevel: 31, maxLevel: 40, title: "Master" },
    { minLevel: 41, maxLevel: 50, title: "Grandmaster" },
    { minLevel: 51, maxLevel: 100, title: "Legend" },
  ],
  // XP rewards for different actions
  xpRewards: {
    watching: {
      perMinute: 1, // 1 XP per minute watched
      bonusPerHour: 10, // Bonus for completing an hour
    },
    social: {
      messagesSent: 1, // 1 XP per 5 messages
      reactionsSent: 1, // 1 XP per 3 reactions
      friendAdded: 25, // 25 XP for adding a friend
    },
    hosting: {
      partyHosted: 50, // 50 XP for hosting a party
      partyWithMembers: 10, // +10 XP per member (up to 5)
    },
    streaks: {
      dailyMaintained: 10, // 10 XP for maintaining streak
      weekMilestone: 50, // 50 XP for 7-day streak
      monthMilestone: 200, // 200 XP for 30-day streak
    },
    badges: {
      badgeEarned: 100, // 100 XP per badge
    },
    challenges: {
      // Variable based on challenge difficulty
    },
    milestones: {
      videos100: 500,
      videos500: 1000,
      watchTime24h: 500,
      watchTime100h: 2000,
      friends25: 300,
      parties50: 750,
    },
  },
};

// Calculate level from total XP
function calculateLevel(totalXp: number): number {
  const { xpPerLevel } = LEVEL_CONFIG;

  for (let i = xpPerLevel.length - 1; i >= 0; i--) {
    if (totalXp >= xpPerLevel[i]) {
      // Check if beyond defined levels
      if (i === xpPerLevel.length - 1) {
        const extraXp = totalXp - xpPerLevel[i];
        const extraLevels = Math.floor(extraXp / 3000);

        return i + 1 + extraLevels;
      }

      return i + 1;
    }
  }

  return 1;
}

// Get XP required for next level
function getXpForNextLevel(currentLevel: number): number {
  const { xpPerLevel } = LEVEL_CONFIG;

  if (currentLevel < xpPerLevel.length) {
    return xpPerLevel[currentLevel];
  }

  // Beyond defined levels
  const lastDefined = xpPerLevel[xpPerLevel.length - 1];
  const levelsAbove = currentLevel - xpPerLevel.length;

  return lastDefined + (levelsAbove + 1) * 3000;
}

// Get XP required for current level
function getXpForCurrentLevel(currentLevel: number): number {
  const { xpPerLevel } = LEVEL_CONFIG;

  if (currentLevel <= 1) return 0;

  if (currentLevel <= xpPerLevel.length) {
    return xpPerLevel[currentLevel - 1];
  }

  // Beyond defined levels
  const lastDefined = xpPerLevel[xpPerLevel.length - 1];
  const levelsAbove = currentLevel - 1 - xpPerLevel.length;

  return lastDefined + levelsAbove * 3000;
}

// Get title for level
function getTitleForLevel(level: number): string {
  const { titles } = LEVEL_CONFIG;

  for (const tier of titles) {
    if (level >= tier.minLevel && level <= tier.maxLevel) {
      return tier.title;
    }
  }

  return "Legend";
}

// ============================================
// LEVEL QUERIES
// ============================================

export const getMyLevel = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return null;

    const levelRecord = await ctx.db
      .query("userLevels")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!levelRecord) {
      // User hasn't been initialized yet
      return {
        level: 1,
        title: "Newbie",
        currentXp: 0,
        totalXp: 0,
        xpForCurrentLevel: 0,
        xpForNextLevel: LEVEL_CONFIG.xpPerLevel[1],
        progressPercent: 0,
        lastXpGain: null,
      };
    }

    const xpForCurrentLevel = getXpForCurrentLevel(levelRecord.level);
    const xpForNextLevel = getXpForNextLevel(levelRecord.level);
    const xpInCurrentLevel = levelRecord.totalXp - xpForCurrentLevel;
    const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;

    return {
      level: levelRecord.level,
      title: levelRecord.title,
      currentXp: levelRecord.currentXp,
      totalXp: levelRecord.totalXp,
      xpForCurrentLevel,
      xpForNextLevel,
      xpInCurrentLevel,
      xpNeededForNextLevel,
      progressPercent: Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100),
      lastXpGain: levelRecord.lastXpGain,
    };
  },
});

export const getUserLevel = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const levelRecord = await ctx.db
      .query("userLevels")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!levelRecord) {
      return {
        level: 1,
        title: "Newbie",
        totalXp: 0,
      };
    }

    return {
      level: levelRecord.level,
      title: levelRecord.title,
      totalXp: levelRecord.totalXp,
    };
  },
});

export const getXpHistory = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return [];

    const transactions = await ctx.db
      .query("xpTransactions")
      .withIndex("by_user_time", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit || 50);

    return transactions.map((tx) => ({
      ...tx,
      createdAt: new Date(tx.createdAt).toISOString(),
    }));
  },
});

export const getLevelLeaderboard = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const allLevels = await ctx.db.query("userLevels").collect();

    // Sort by total XP
    const sorted = allLevels.sort((a, b) => b.totalXp - a.totalXp);
    const top = sorted.slice(0, args.limit || 10);

    // Add user info
    return Promise.all(
      top.map(async (levelRecord, index) => {
        const user = await ctx.db.get(levelRecord.userId);

        return {
          rank: index + 1,
          level: levelRecord.level,
          title: levelRecord.title,
          totalXp: levelRecord.totalXp,
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
  },
});

// ============================================
// LEVEL MUTATIONS
// ============================================

export const initializeUserLevel = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    // Check if already initialized
    const existing = await ctx.db
      .query("userLevels")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existing) {
      return { success: true, message: "Already initialized" };
    }

    await ctx.db.insert("userLevels", {
      userId: user._id,
      currentXp: 0,
      totalXp: 0,
      level: 1,
      title: "Newbie",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const awardXp = mutation({
  args: {
    amount: v.number(),
    reason: v.string(),
    type: v.union(
      v.literal("challenge"),
      v.literal("badge"),
      v.literal("streak"),
      v.literal("watching"),
      v.literal("social"),
      v.literal("hosting"),
      v.literal("event"),
      v.literal("bonus")
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

    // Get or create level record
    let levelRecord = await ctx.db
      .query("userLevels")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!levelRecord) {
      const newId = await ctx.db.insert("userLevels", {
        userId: user._id,
        currentXp: 0,
        totalXp: 0,
        level: 1,
        title: "Newbie",
        updatedAt: Date.now(),
      });
      levelRecord = await ctx.db.get(newId);
    }

    if (!levelRecord) throw new Error("Failed to create level record");

    // Calculate new totals
    const newTotalXp = levelRecord.totalXp + args.amount;
    const newLevel = calculateLevel(newTotalXp);
    const didLevelUp = newLevel > levelRecord.level;

    // Calculate current XP for level progress display
    const xpForCurrentLevel = getXpForCurrentLevel(newLevel);
    const newCurrentXp = newTotalXp - xpForCurrentLevel;

    // Update level record
    await ctx.db.patch(levelRecord._id, {
      currentXp: newCurrentXp,
      totalXp: newTotalXp,
      level: newLevel,
      title: getTitleForLevel(newLevel),
      lastXpGain: {
        amount: args.amount,
        reason: args.reason,
        timestamp: Date.now(),
      },
      updatedAt: Date.now(),
    });

    // Log transaction
    await ctx.db.insert("xpTransactions", {
      userId: user._id,
      amount: args.amount,
      reason: args.reason,
      type: args.type,
      createdAt: Date.now(),
    });

    // Send level up notification if applicable
    if (didLevelUp) {
      await ctx.db.insert("notifications", {
        userId: user._id,
        type: "level_up",
        title: `Level Up! 🎉`,
        message: `Congratulations! You've reached Level ${newLevel} - ${getTitleForLevel(newLevel)}!`,
        read: false,
        data: {
          newLevel,
          newTitle: getTitleForLevel(newLevel),
        },
        createdAt: Date.now(),
      });

      // Log activity
      await ctx.db.insert("userActivity", {
        userId: user._id,
        type: "earned_badge", // Reusing for milestone type
        badgeName: `Level ${newLevel}`,
        isActive: false,
        createdAt: Date.now(),
      });
    }

    return {
      success: true,
      xpAwarded: args.amount,
      newTotalXp,
      newLevel,
      didLevelUp,
      newTitle: didLevelUp ? getTitleForLevel(newLevel) : undefined,
    };
  },
});

export const checkAndAwardMilestoneXp = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return [];

    const { milestones } = LEVEL_CONFIG.xpRewards;
    const awarded: string[] = [];

    // Check video milestones
    if (user.stats.videosWatched >= 100) {
      const alreadyAwarded = await checkMilestoneAwarded(ctx, user._id, "videos100");
      if (!alreadyAwarded) {
        await awardMilestone(ctx, user._id, "videos100", milestones.videos100, "Watched 100 videos!");
        awarded.push("videos100");
      }
    }

    if (user.stats.videosWatched >= 500) {
      const alreadyAwarded = await checkMilestoneAwarded(ctx, user._id, "videos500");
      if (!alreadyAwarded) {
        await awardMilestone(ctx, user._id, "videos500", milestones.videos500, "Watched 500 videos!");
        awarded.push("videos500");
      }
    }

    // Check watch time milestones (totalWatchTime is in minutes)
    if (user.stats.totalWatchTime >= 24 * 60) {
      const alreadyAwarded = await checkMilestoneAwarded(ctx, user._id, "watchTime24h");
      if (!alreadyAwarded) {
        await awardMilestone(ctx, user._id, "watchTime24h", milestones.watchTime24h, "Watched for 24 hours total!");
        awarded.push("watchTime24h");
      }
    }

    if (user.stats.totalWatchTime >= 100 * 60) {
      const alreadyAwarded = await checkMilestoneAwarded(ctx, user._id, "watchTime100h");
      if (!alreadyAwarded) {
        await awardMilestone(ctx, user._id, "watchTime100h", milestones.watchTime100h, "Watched for 100 hours total!");
        awarded.push("watchTime100h");
      }
    }

    // Check party milestone
    if (user.stats.partiesHosted >= 50) {
      const alreadyAwarded = await checkMilestoneAwarded(ctx, user._id, "parties50");
      if (!alreadyAwarded) {
        await awardMilestone(ctx, user._id, "parties50", milestones.parties50, "Hosted 50 watch parties!");
        awarded.push("parties50");
      }
    }

    return awarded;
  },
});

// Helper to check if milestone was already awarded
async function checkMilestoneAwarded(
  ctx: { db: any },
  userId: any,
  milestone: string
): Promise<boolean> {
  const transactions = await ctx.db
    .query("xpTransactions")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .collect();

  return transactions.some(
    (tx: any) => tx.type === "bonus" && tx.reason.includes(milestone)
  );
}

// Helper to award milestone
async function awardMilestone(
  ctx: { db: any },
  userId: any,
  milestone: string,
  xpAmount: number,
  message: string
): Promise<void> {
  // Get level record
  const levelRecord = await ctx.db
    .query("userLevels")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();

  if (levelRecord) {
    const newTotalXp = levelRecord.totalXp + xpAmount;
    const newLevel = calculateLevel(newTotalXp);
    const xpForCurrentLevel = getXpForCurrentLevel(newLevel);

    await ctx.db.patch(levelRecord._id, {
      currentXp: newTotalXp - xpForCurrentLevel,
      totalXp: newTotalXp,
      level: newLevel,
      title: getTitleForLevel(newLevel),
      lastXpGain: {
        amount: xpAmount,
        reason: message,
        timestamp: Date.now(),
      },
      updatedAt: Date.now(),
    });
  }

  // Log transaction
  await ctx.db.insert("xpTransactions", {
    userId,
    amount: xpAmount,
    reason: `Milestone: ${milestone} - ${message}`,
    type: "bonus",
    createdAt: Date.now(),
  });

  // Create notification
  await ctx.db.insert("notifications", {
    userId,
    type: "milestone_reached",
    title: "Milestone Reached! 🏆",
    message: `${message} You earned ${xpAmount} XP!`,
    read: false,
    data: { milestone, xpAmount },
    createdAt: Date.now(),
  });
}
