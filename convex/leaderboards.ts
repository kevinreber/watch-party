import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// LEADERBOARD QUERIES
// ============================================

export const getLeaderboard = query({
  args: {
    period: v.union(v.literal("weekly"), v.literal("monthly"), v.literal("alltime")),
    category: v.union(
      v.literal("watchTime"),
      v.literal("partiesHosted"),
      v.literal("messagesSent"),
      v.literal("reactionsGiven")
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Try to get cached leaderboard first
    const cached = await ctx.db
      .query("leaderboardEntries")
      .withIndex("by_period_category", (q) =>
        q.eq("period", args.period).eq("category", args.category)
      )
      .collect();

    if (cached.length > 0) {
      // Check if cache is fresh (less than 1 hour old)
      const cacheAge = Date.now() - cached[0].updatedAt;
      if (cacheAge < 60 * 60 * 1000) {
        return cached
          .sort((a, b) => a.rank - b.rank)
          .slice(0, args.limit || 10)
          .map((entry) => ({
            rank: entry.rank,
            score: entry.score,
            user: {
              _id: entry.userId,
              username: entry.username,
              avatar: entry.avatar,
              avatarColor: entry.avatarColor,
            },
          }));
      }
    }

    // Generate fresh leaderboard from user stats
    const users = await ctx.db.query("users").collect();

    let sortedUsers;
    switch (args.category) {
      case "watchTime":
        sortedUsers = users.sort((a, b) => b.stats.totalWatchTime - a.stats.totalWatchTime);
        break;
      case "partiesHosted":
        sortedUsers = users.sort((a, b) => b.stats.partiesHosted - a.stats.partiesHosted);
        break;
      case "messagesSent":
        sortedUsers = users.sort((a, b) => b.stats.messagesSent - a.stats.messagesSent);
        break;
      case "reactionsGiven":
        sortedUsers = users.sort((a, b) => b.stats.reactionsGiven - a.stats.reactionsGiven);
        break;
      default:
        sortedUsers = users;
    }

    const topUsers = sortedUsers.slice(0, args.limit || 10);

    return topUsers.map((user, index) => {
      let score;
      switch (args.category) {
        case "watchTime":
          score = user.stats.totalWatchTime;
          break;
        case "partiesHosted":
          score = user.stats.partiesHosted;
          break;
        case "messagesSent":
          score = user.stats.messagesSent;
          break;
        case "reactionsGiven":
          score = user.stats.reactionsGiven;
          break;
        default:
          score = 0;
      }

      return {
        rank: index + 1,
        score,
        user: {
          _id: user._id,
          username: user.username,
          avatar: user.avatar,
          avatarColor: user.avatarColor,
        },
      };
    });
  },
});

export const getMyRanking = query({
  args: {
    category: v.union(
      v.literal("watchTime"),
      v.literal("partiesHosted"),
      v.literal("messagesSent"),
      v.literal("reactionsGiven")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return null;

    // Get all users and sort
    const users = await ctx.db.query("users").collect();

    let sortedUsers;
    let myScore;
    switch (args.category) {
      case "watchTime":
        sortedUsers = users.sort((a, b) => b.stats.totalWatchTime - a.stats.totalWatchTime);
        myScore = user.stats.totalWatchTime;
        break;
      case "partiesHosted":
        sortedUsers = users.sort((a, b) => b.stats.partiesHosted - a.stats.partiesHosted);
        myScore = user.stats.partiesHosted;
        break;
      case "messagesSent":
        sortedUsers = users.sort((a, b) => b.stats.messagesSent - a.stats.messagesSent);
        myScore = user.stats.messagesSent;
        break;
      case "reactionsGiven":
        sortedUsers = users.sort((a, b) => b.stats.reactionsGiven - a.stats.reactionsGiven);
        myScore = user.stats.reactionsGiven;
        break;
      default:
        return null;
    }

    const rank = sortedUsers.findIndex((u) => u._id === user._id) + 1;
    const totalUsers = users.length;
    const percentile = Math.round((1 - (rank - 1) / totalUsers) * 100);

    return {
      rank,
      totalUsers,
      percentile,
      score: myScore,
    };
  },
});

export const getAllTimeStats = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();

    const totalWatchTime = users.reduce((sum, u) => sum + u.stats.totalWatchTime, 0);
    const totalVideosWatched = users.reduce((sum, u) => sum + u.stats.videosWatched, 0);
    const totalPartiesHosted = users.reduce((sum, u) => sum + u.stats.partiesHosted, 0);
    const totalMessages = users.reduce((sum, u) => sum + u.stats.messagesSent, 0);
    const totalReactions = users.reduce((sum, u) => sum + u.stats.reactionsGiven, 0);

    const rooms = await ctx.db.query("rooms").collect();

    return {
      totalUsers: users.length,
      totalRooms: rooms.length,
      totalWatchTimeHours: Math.round(totalWatchTime / 60),
      totalVideosWatched,
      totalPartiesHosted,
      totalMessages,
      totalReactions,
    };
  },
});

// ============================================
// LEADERBOARD CACHE REFRESH (call periodically)
// ============================================

export const refreshLeaderboardCache = internalMutation({
  args: {},
  handler: async (ctx) => {
    const periods: ("weekly" | "monthly" | "alltime")[] = ["weekly", "monthly", "alltime"];
    const categories: ("watchTime" | "partiesHosted" | "messagesSent" | "reactionsGiven")[] = [
      "watchTime",
      "partiesHosted",
      "messagesSent",
      "reactionsGiven",
    ];

    // Delete old cache
    const oldEntries = await ctx.db.query("leaderboardEntries").collect();
    for (const entry of oldEntries) {
      await ctx.db.delete(entry._id);
    }

    // Get all users
    const users = await ctx.db.query("users").collect();

    for (const period of periods) {
      for (const category of categories) {
        let sortedUsers;
        switch (category) {
          case "watchTime":
            sortedUsers = [...users].sort(
              (a, b) => b.stats.totalWatchTime - a.stats.totalWatchTime
            );
            break;
          case "partiesHosted":
            sortedUsers = [...users].sort(
              (a, b) => b.stats.partiesHosted - a.stats.partiesHosted
            );
            break;
          case "messagesSent":
            sortedUsers = [...users].sort(
              (a, b) => b.stats.messagesSent - a.stats.messagesSent
            );
            break;
          case "reactionsGiven":
            sortedUsers = [...users].sort(
              (a, b) => b.stats.reactionsGiven - a.stats.reactionsGiven
            );
            break;
        }

        // Store top 50 for each category
        const top50 = sortedUsers.slice(0, 50);

        for (let i = 0; i < top50.length; i++) {
          const user = top50[i];
          let score;
          switch (category) {
            case "watchTime":
              score = user.stats.totalWatchTime;
              break;
            case "partiesHosted":
              score = user.stats.partiesHosted;
              break;
            case "messagesSent":
              score = user.stats.messagesSent;
              break;
            case "reactionsGiven":
              score = user.stats.reactionsGiven;
              break;
          }

          await ctx.db.insert("leaderboardEntries", {
            userId: user._id,
            username: user.username,
            avatar: user.avatar,
            avatarColor: user.avatarColor,
            period,
            category,
            score,
            rank: i + 1,
            updatedAt: Date.now(),
          });
        }
      }
    }
  },
});

// ============================================
// CATEGORY-SPECIFIC LEADERBOARDS
// ============================================

export const getWatchTimeLeaderboard = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();
    const sorted = users.sort((a, b) => b.stats.totalWatchTime - a.stats.totalWatchTime);
    const top = sorted.slice(0, args.limit || 10);

    return top.map((user, index) => ({
      rank: index + 1,
      score: user.stats.totalWatchTime,
      scoreFormatted: formatWatchTime(user.stats.totalWatchTime),
      user: {
        _id: user._id,
        username: user.username,
        avatar: user.avatar,
        avatarColor: user.avatarColor,
      },
    }));
  },
});

export const getSocialLeaderboard = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();

    // Social score = messages + reactions + (friends * 10) + (parties hosted * 20)
    const usersWithSocialScore = await Promise.all(
      users.map(async (user) => {
        const friendships = await ctx.db
          .query("friends")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect();

        const socialScore =
          user.stats.messagesSent +
          user.stats.reactionsGiven +
          friendships.length * 10 +
          user.stats.partiesHosted * 20;

        return { user, socialScore };
      })
    );

    const sorted = usersWithSocialScore.sort((a, b) => b.socialScore - a.socialScore);
    const top = sorted.slice(0, args.limit || 10);

    return top.map((entry, index) => ({
      rank: index + 1,
      score: entry.socialScore,
      user: {
        _id: entry.user._id,
        username: entry.user.username,
        avatar: entry.user.avatar,
        avatarColor: entry.user.avatarColor,
      },
    }));
  },
});

// Helper function
function formatWatchTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return `${hours}h ${mins}m`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d ${remainingHours}h`;
}
