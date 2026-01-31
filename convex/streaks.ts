import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Helper to get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

// Helper to get yesterday's date
function getYesterdayDate(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return yesterday.toISOString().split("T")[0];
}

// Helper to get the start of the current week (Monday)
function getWeekStartDate(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  const monday = new Date(now.setDate(diff));

  return monday.toISOString().split("T")[0];
}

// Helper to get date N days ago
function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);

  return date.toISOString().split("T")[0];
}

// ============================================
// DAILY WATCH LOG
// ============================================

export const logDailyWatch = mutation({
  args: {
    watchTime: v.number(), // in seconds
    videosWatched: v.optional(v.number()),
    roomsVisited: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const today = getTodayDate();

    // Check if we have a log for today
    const existingLogs = await ctx.db
      .query("dailyWatchLog")
      .withIndex("by_user_date", (q) => q.eq("userId", user._id).eq("date", today))
      .collect();

    const existingLog = existingLogs[0];

    if (existingLog) {
      // Update existing log
      await ctx.db.patch(existingLog._id, {
        watchTime: existingLog.watchTime + args.watchTime,
        videosWatched: existingLog.videosWatched + (args.videosWatched || 0),
        roomsVisited: existingLog.roomsVisited + (args.roomsVisited || 0),
      });
    } else {
      // Create new log
      await ctx.db.insert("dailyWatchLog", {
        userId: user._id,
        date: today,
        watchTime: args.watchTime,
        videosWatched: args.videosWatched || 0,
        roomsVisited: args.roomsVisited || 0,
      });

      // Update streak since this is a new day
      await updateStreak(ctx, user._id, today);
    }

    return { success: true };
  },
});

// Internal function to update streak
async function updateStreak(
  ctx: { db: any },
  userId: any,
  today: string
) {
  const streakRecords = await ctx.db
    .query("watchStreaks")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .collect();

  const streakRecord = streakRecords[0];
  const yesterday = getYesterdayDate();

  if (streakRecord) {
    if (streakRecord.lastWatchDate === today) {
      // Already updated today
      return;
    }

    if (streakRecord.lastWatchDate === yesterday) {
      // Continue streak
      const newStreak = streakRecord.currentStreak + 1;
      await ctx.db.patch(streakRecord._id, {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, streakRecord.longestStreak),
        lastWatchDate: today,
        totalDaysWatched: streakRecord.totalDaysWatched + 1,
      });
    } else {
      // Streak broken, start new one
      await ctx.db.patch(streakRecord._id, {
        currentStreak: 1,
        lastWatchDate: today,
        streakStartDate: today,
        totalDaysWatched: streakRecord.totalDaysWatched + 1,
      });
    }
  } else {
    // First time watching
    await ctx.db.insert("watchStreaks", {
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastWatchDate: today,
      streakStartDate: today,
      totalDaysWatched: 1,
    });
  }
}

// ============================================
// STREAK QUERIES
// ============================================

export const getMyStreak = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return null;

    const streakRecords = await ctx.db
      .query("watchStreaks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const streakRecord = streakRecords[0];
    if (!streakRecord) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalDaysWatched: 0,
        isActiveToday: false,
        lastWatchDate: null,
      };
    }

    const today = getTodayDate();
    const yesterday = getYesterdayDate();

    // Check if streak is still active
    const isStreakActive =
      streakRecord.lastWatchDate === today || streakRecord.lastWatchDate === yesterday;

    return {
      currentStreak: isStreakActive ? streakRecord.currentStreak : 0,
      longestStreak: streakRecord.longestStreak,
      totalDaysWatched: streakRecord.totalDaysWatched,
      isActiveToday: streakRecord.lastWatchDate === today,
      lastWatchDate: streakRecord.lastWatchDate,
      streakStartDate: streakRecord.streakStartDate,
    };
  },
});

export const getDailyWatchHistory = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return [];

    const logs = await ctx.db
      .query("dailyWatchLog")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Sort by date descending and take the requested number of days
    const sortedLogs = logs
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, args.days || 30);

    return sortedLogs.map((log) => ({
      ...log,
      watchTimeMinutes: Math.round(log.watchTime / 60),
    }));
  },
});

export const getStreakLeaderboard = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const allStreaks = await ctx.db.query("watchStreaks").collect();

    const today = getTodayDate();
    const yesterday = getYesterdayDate();

    // Filter to active streaks only
    const activeStreaks = allStreaks.filter(
      (s) => s.lastWatchDate === today || s.lastWatchDate === yesterday
    );

    // Sort by current streak
    const sorted = activeStreaks.sort((a, b) => b.currentStreak - a.currentStreak);
    const top = sorted.slice(0, args.limit || 10);

    // Add user info
    return Promise.all(
      top.map(async (streak, index) => {
        const user = await ctx.db.get(streak.userId);
        return {
          rank: index + 1,
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
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
// STREAK ACHIEVEMENTS CHECK
// ============================================

export const checkStreakBadges = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return [];

    const streakRecords = await ctx.db
      .query("watchStreaks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const streak = streakRecords[0];
    if (!streak) return [];

    // Get existing badges
    const existingBadges = await ctx.db
      .query("badges")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const existingBadgeNames = existingBadges.map((b) => b.name);
    const newBadges: string[] = [];

    // Define streak badges
    const streakBadges = [
      { name: "Week Warrior", threshold: 7, icon: "🔥", description: "7 day watch streak" },
      { name: "Fortnight Fan", threshold: 14, icon: "⚡", description: "14 day watch streak" },
      { name: "Monthly Marvel", threshold: 30, icon: "🌟", description: "30 day watch streak" },
      { name: "Streak Legend", threshold: 100, icon: "👑", description: "100 day watch streak" },
    ];

    for (const badge of streakBadges) {
      if (
        streak.currentStreak >= badge.threshold &&
        !existingBadgeNames.includes(badge.name)
      ) {
        await ctx.db.insert("badges", {
          userId: user._id,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          category: "watching",
          earnedAt: Date.now(),
        });

        // Log activity
        await ctx.db.insert("userActivity", {
          userId: user._id,
          type: "earned_badge",
          badgeName: badge.name,
          isActive: false,
          createdAt: Date.now(),
        });

        newBadges.push(badge.name);
      }
    }

    return newBadges;
  },
});

// ============================================
// STREAK FREEZE TOKENS
// ============================================

export const getStreakFreezeStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return null;

    const streakRecord = await ctx.db
      .query("watchStreaks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!streakRecord) {
      return {
        freezeTokens: 0,
        maxTokens: 2,
        canEarnTokenThisWeek: true,
        streakAtRisk: false,
      };
    }

    const today = getTodayDate();
    const yesterday = getYesterdayDate();
    const currentWeekStart = getWeekStartDate();

    // Check if user can earn a token this week
    const tokensEarnedThisWeek = streakRecord.freezeTokensEarnedThisWeek || 0;
    const weekStartDate = streakRecord.weekStartDate;
    const isNewWeek = !weekStartDate || weekStartDate !== currentWeekStart;
    const canEarnTokenThisWeek = isNewWeek || tokensEarnedThisWeek < 1;

    // Check if streak is at risk (didn't watch yesterday or today)
    const streakAtRisk =
      streakRecord.lastWatchDate !== today && streakRecord.lastWatchDate !== yesterday;

    return {
      freezeTokens: streakRecord.freezeTokens || 0,
      maxTokens: 2,
      canEarnTokenThisWeek,
      lastFreezeUsed: streakRecord.lastFreezeUsed,
      streakAtRisk,
      currentStreak: streakRecord.currentStreak,
    };
  },
});

export const earnFreezeToken = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const streakRecord = await ctx.db
      .query("watchStreaks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    const currentWeekStart = getWeekStartDate();
    const maxTokens = 2;

    if (!streakRecord) {
      // Create streak record with a token
      await ctx.db.insert("watchStreaks", {
        userId: user._id,
        currentStreak: 0,
        longestStreak: 0,
        lastWatchDate: "",
        streakStartDate: "",
        totalDaysWatched: 0,
        freezeTokens: 1,
        freezeTokensEarnedThisWeek: 1,
        weekStartDate: currentWeekStart,
      });

      return { success: true, newTokenCount: 1 };
    }

    // Check if already at max tokens
    const currentTokens = streakRecord.freezeTokens || 0;
    if (currentTokens >= maxTokens) {
      return { success: false, message: "Already at maximum freeze tokens" };
    }

    // Check if already earned this week
    const isNewWeek = streakRecord.weekStartDate !== currentWeekStart;
    const tokensEarnedThisWeek = isNewWeek ? 0 : streakRecord.freezeTokensEarnedThisWeek || 0;

    if (tokensEarnedThisWeek >= 1) {
      return { success: false, message: "Already earned a freeze token this week" };
    }

    // Award token
    await ctx.db.patch(streakRecord._id, {
      freezeTokens: currentTokens + 1,
      freezeTokensEarnedThisWeek: tokensEarnedThisWeek + 1,
      weekStartDate: currentWeekStart,
    });

    return { success: true, newTokenCount: currentTokens + 1 };
  },
});

export const useStreakFreeze = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const streakRecord = await ctx.db
      .query("watchStreaks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!streakRecord) {
      throw new Error("No streak record found");
    }

    const currentTokens = streakRecord.freezeTokens || 0;
    if (currentTokens < 1) {
      throw new Error("No freeze tokens available");
    }

    const today = getTodayDate();
    const yesterday = getYesterdayDate();
    const twoDaysAgo = getDateDaysAgo(2);

    // Only allow freeze if streak would be broken
    // (last watch was 2 days ago, meaning yesterday was missed)
    if (streakRecord.lastWatchDate === today || streakRecord.lastWatchDate === yesterday) {
      return { success: false, message: "Streak is not at risk" };
    }

    // Check if streak was active before the miss
    if (streakRecord.lastWatchDate !== twoDaysAgo) {
      return { success: false, message: "Streak has already been broken for too long" };
    }

    // Use the freeze token - preserve the streak by updating lastWatchDate to yesterday
    await ctx.db.patch(streakRecord._id, {
      freezeTokens: currentTokens - 1,
      lastFreezeUsed: yesterday,
      lastWatchDate: yesterday, // This preserves the streak
    });

    // Create notification
    await ctx.db.insert("notifications", {
      userId: user._id,
      type: "streak_frozen",
      title: "Streak Frozen! ❄️",
      message: `You used a freeze token to save your ${streakRecord.currentStreak} day streak!`,
      read: false,
      data: { streakPreserved: streakRecord.currentStreak },
      createdAt: Date.now(),
    });

    return {
      success: true,
      streakPreserved: streakRecord.currentStreak,
      remainingTokens: currentTokens - 1,
    };
  },
});

export const checkStreakWarning = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { atRisk: false };

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return { atRisk: false };

    const streakRecord = await ctx.db
      .query("watchStreaks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!streakRecord || streakRecord.currentStreak < 3) {
      return { atRisk: false };
    }

    const today = getTodayDate();
    const yesterday = getYesterdayDate();

    // Streak is at risk if last watch was yesterday (need to watch today)
    const atRisk = streakRecord.lastWatchDate === yesterday;

    if (atRisk) {
      // Check if we already sent a warning today
      const existingNotifications = await ctx.db
        .query("notifications")
        .withIndex("by_user_and_time", (q) => q.eq("userId", user._id))
        .order("desc")
        .take(10);

      const alreadyWarned = existingNotifications.some(
        (n) =>
          n.type === "streak_warning" &&
          new Date(n.createdAt).toISOString().split("T")[0] === today
      );

      if (!alreadyWarned) {
        await ctx.db.insert("notifications", {
          userId: user._id,
          type: "streak_warning",
          title: "Streak at Risk! ⚠️",
          message: `Don't lose your ${streakRecord.currentStreak} day streak! Watch something today to keep it going.`,
          read: false,
          data: {
            currentStreak: streakRecord.currentStreak,
            freezeTokensAvailable: streakRecord.freezeTokens || 0,
          },
          createdAt: Date.now(),
        });
      }
    }

    return {
      atRisk,
      currentStreak: streakRecord.currentStreak,
      freezeTokensAvailable: streakRecord.freezeTokens || 0,
    };
  },
});
