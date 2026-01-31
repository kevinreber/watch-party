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
