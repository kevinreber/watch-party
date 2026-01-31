import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// BADGE DEFINITIONS
// ============================================

export const BADGE_DEFINITIONS = {
  // Watching badges
  watching: [
    { name: "First Watch", icon: "🎬", description: "Watch your first video", threshold: { videosWatched: 1 } },
    { name: "Movie Buff", icon: "🎥", description: "Watch 10 videos", threshold: { videosWatched: 10 } },
    { name: "Binge Watcher", icon: "📺", description: "Watch 50 videos", threshold: { videosWatched: 50 } },
    { name: "Screen Addict", icon: "🖥️", description: "Watch 100 videos", threshold: { videosWatched: 100 } },
    { name: "Marathon Runner", icon: "🏃", description: "Watch 500 videos", threshold: { videosWatched: 500 } },
    { name: "Hour Hero", icon: "⏰", description: "Accumulate 60 minutes watch time", threshold: { totalWatchTime: 60 } },
    { name: "Day Dreamer", icon: "🌅", description: "Accumulate 24 hours watch time", threshold: { totalWatchTime: 1440 } },
    { name: "Week Warrior", icon: "🔥", description: "7 day watch streak", threshold: { streak: 7 } },
    { name: "Fortnight Fan", icon: "⚡", description: "14 day watch streak", threshold: { streak: 14 } },
    { name: "Monthly Marvel", icon: "🌟", description: "30 day watch streak", threshold: { streak: 30 } },
    { name: "Streak Legend", icon: "👑", description: "100 day watch streak", threshold: { streak: 100 } },
  ],

  // Hosting badges
  hosting: [
    { name: "Party Starter", icon: "🎉", description: "Host your first watch party", threshold: { partiesHosted: 1 } },
    { name: "Party Animal", icon: "🦁", description: "Host 5 watch parties", threshold: { partiesHosted: 5 } },
    { name: "Event Organizer", icon: "📋", description: "Host 20 watch parties", threshold: { partiesHosted: 20 } },
    { name: "Party Legend", icon: "🏆", description: "Host 50 watch parties", threshold: { partiesHosted: 50 } },
    { name: "Entertainment Mogul", icon: "🎭", description: "Host 100 watch parties", threshold: { partiesHosted: 100 } },
  ],

  // Social badges
  social: [
    { name: "Friendly", icon: "👋", description: "Add your first friend", threshold: { friends: 1 } },
    { name: "Social Butterfly", icon: "🦋", description: "Have 10 friends", threshold: { friends: 10 } },
    { name: "Popular", icon: "⭐", description: "Have 25 friends", threshold: { friends: 25 } },
    { name: "Influencer", icon: "📢", description: "Have 50 friends", threshold: { friends: 50 } },
    { name: "Chatterbox", icon: "💬", description: "Send 100 messages", threshold: { messagesSent: 100 } },
    { name: "Conversationalist", icon: "🗣️", description: "Send 500 messages", threshold: { messagesSent: 500 } },
    { name: "Reaction King", icon: "😄", description: "Send 50 reactions", threshold: { reactionsGiven: 50 } },
    { name: "Emoji Master", icon: "🎨", description: "Send 200 reactions", threshold: { reactionsGiven: 200 } },
    { name: "Group Creator", icon: "👥", description: "Create a group", threshold: { groupsCreated: 1 } },
    { name: "Community Builder", icon: "🏗️", description: "Create 5 groups", threshold: { groupsCreated: 5 } },
  ],

  // Special badges
  special: [
    { name: "Early Bird", icon: "🐦", description: "Join during beta", threshold: { special: "early_bird" } },
    { name: "Night Owl", icon: "🦉", description: "Watch after midnight", threshold: { special: "night_owl" } },
    { name: "Weekend Warrior", icon: "🎮", description: "Watch 5 hours on a weekend", threshold: { special: "weekend_warrior" } },
    { name: "Playlist Pro", icon: "📝", description: "Create 5 playlists", threshold: { playlistsCreated: 5 } },
    { name: "Curator", icon: "🖼️", description: "Add 50 videos to playlists", threshold: { playlistVideosAdded: 50 } },
    { name: "Top 10", icon: "🥇", description: "Reach top 10 on any leaderboard", threshold: { special: "top_10" } },
    { name: "Verified", icon: "✅", description: "Verified user", threshold: { special: "verified" } },
  ],
};

// ============================================
// BADGE QUERIES
// ============================================

export const getMyBadges = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return [];

    const badges = await ctx.db
      .query("badges")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return badges.map((badge) => ({
      ...badge,
      earnedAt: new Date(badge.earnedAt).toISOString(),
    }));
  },
});

export const getUserBadges = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const badges = await ctx.db
      .query("badges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return badges.map((badge) => ({
      ...badge,
      earnedAt: new Date(badge.earnedAt).toISOString(),
    }));
  },
});

export const getAllBadgeDefinitions = query({
  args: {},
  handler: async () => {
    return BADGE_DEFINITIONS;
  },
});

export const getBadgeProgress = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return null;

    // Get earned badges
    const earnedBadges = await ctx.db
      .query("badges")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const earnedBadgeNames = new Set(earnedBadges.map((b) => b.name));

    // Get additional stats
    const friendships = await ctx.db
      .query("friends")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const playlists = await ctx.db
      .query("playlists")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const groups = await ctx.db
      .query("groups")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();

    const streakRecords = await ctx.db
      .query("watchStreaks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const streak = streakRecords[0];

    const currentStats = {
      videosWatched: user.stats.videosWatched,
      totalWatchTime: user.stats.totalWatchTime,
      partiesHosted: user.stats.partiesHosted,
      messagesSent: user.stats.messagesSent,
      reactionsGiven: user.stats.reactionsGiven,
      friends: friendships.length,
      playlistsCreated: playlists.length,
      groupsCreated: groups.length,
      streak: streak?.currentStreak || 0,
    };

    // Calculate progress for each badge
    const progress: Record<string, { earned: boolean; current: number; required: number; percentage: number }> = {};

    for (const category of Object.values(BADGE_DEFINITIONS)) {
      for (const badge of category) {
        const threshold = badge.threshold;
        let current = 0;
        let required = 0;

        if ("videosWatched" in threshold) {
          current = currentStats.videosWatched;
          required = threshold.videosWatched!;
        } else if ("totalWatchTime" in threshold) {
          current = currentStats.totalWatchTime;
          required = threshold.totalWatchTime!;
        } else if ("partiesHosted" in threshold) {
          current = currentStats.partiesHosted;
          required = threshold.partiesHosted!;
        } else if ("messagesSent" in threshold) {
          current = currentStats.messagesSent;
          required = threshold.messagesSent!;
        } else if ("reactionsGiven" in threshold) {
          current = currentStats.reactionsGiven;
          required = threshold.reactionsGiven!;
        } else if ("friends" in threshold) {
          current = currentStats.friends;
          required = threshold.friends!;
        } else if ("playlistsCreated" in threshold) {
          current = currentStats.playlistsCreated;
          required = threshold.playlistsCreated!;
        } else if ("groupsCreated" in threshold) {
          current = currentStats.groupsCreated;
          required = threshold.groupsCreated!;
        } else if ("streak" in threshold) {
          current = currentStats.streak;
          required = threshold.streak!;
        } else if ("special" in threshold) {
          // Special badges are handled separately
          current = earnedBadgeNames.has(badge.name) ? 1 : 0;
          required = 1;
        }

        progress[badge.name] = {
          earned: earnedBadgeNames.has(badge.name),
          current,
          required,
          percentage: required > 0 ? Math.min(100, Math.round((current / required) * 100)) : 0,
        };
      }
    }

    return {
      earnedCount: earnedBadges.length,
      totalCount: Object.values(BADGE_DEFINITIONS).flat().length,
      progress,
    };
  },
});

// ============================================
// BADGE CHECKING & AWARDING
// ============================================

export const checkAndAwardBadges = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return [];

    // Get existing badges
    const existingBadges = await ctx.db
      .query("badges")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const earnedBadgeNames = new Set(existingBadges.map((b) => b.name));

    // Get additional stats
    const friendships = await ctx.db
      .query("friends")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const playlists = await ctx.db
      .query("playlists")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const groups = await ctx.db
      .query("groups")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();

    const streakRecords = await ctx.db
      .query("watchStreaks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const streak = streakRecords[0];

    const currentStats = {
      videosWatched: user.stats.videosWatched,
      totalWatchTime: user.stats.totalWatchTime,
      partiesHosted: user.stats.partiesHosted,
      messagesSent: user.stats.messagesSent,
      reactionsGiven: user.stats.reactionsGiven,
      friends: friendships.length,
      playlistsCreated: playlists.length,
      groupsCreated: groups.length,
      streak: streak?.currentStreak || 0,
    };

    const newBadges: string[] = [];

    // Check each badge category
    for (const [category, badges] of Object.entries(BADGE_DEFINITIONS)) {
      for (const badge of badges) {
        if (earnedBadgeNames.has(badge.name)) continue;

        const threshold = badge.threshold;
        let earned = false;

        if ("videosWatched" in threshold) {
          earned = currentStats.videosWatched >= threshold.videosWatched!;
        } else if ("totalWatchTime" in threshold) {
          earned = currentStats.totalWatchTime >= threshold.totalWatchTime!;
        } else if ("partiesHosted" in threshold) {
          earned = currentStats.partiesHosted >= threshold.partiesHosted!;
        } else if ("messagesSent" in threshold) {
          earned = currentStats.messagesSent >= threshold.messagesSent!;
        } else if ("reactionsGiven" in threshold) {
          earned = currentStats.reactionsGiven >= threshold.reactionsGiven!;
        } else if ("friends" in threshold) {
          earned = currentStats.friends >= threshold.friends!;
        } else if ("playlistsCreated" in threshold) {
          earned = currentStats.playlistsCreated >= threshold.playlistsCreated!;
        } else if ("groupsCreated" in threshold) {
          earned = currentStats.groupsCreated >= threshold.groupsCreated!;
        } else if ("streak" in threshold) {
          earned = currentStats.streak >= threshold.streak!;
        }
        // Special badges are awarded separately

        if (earned) {
          await ctx.db.insert("badges", {
            userId: user._id,
            name: badge.name,
            description: badge.description,
            icon: badge.icon,
            category: category as "watching" | "hosting" | "social" | "special",
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
    }

    return newBadges;
  },
});

export const awardSpecialBadge = mutation({
  args: {
    userId: v.id("users"),
    badgeName: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the badge definition
    let badgeInfo = null;
    let badgeCategory = null;

    for (const [category, badges] of Object.entries(BADGE_DEFINITIONS)) {
      const found = badges.find((b) => b.name === args.badgeName);
      if (found) {
        badgeInfo = found;
        badgeCategory = category;
        break;
      }
    }

    if (!badgeInfo) throw new Error("Badge not found");

    // Check if already has badge
    const existing = await ctx.db
      .query("badges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    if (existing.some((b) => b.name === args.badgeName)) {
      return { success: false, message: "User already has this badge" };
    }

    await ctx.db.insert("badges", {
      userId: args.userId,
      name: badgeInfo.name,
      description: badgeInfo.description,
      icon: badgeInfo.icon,
      category: badgeCategory as "watching" | "hosting" | "social" | "special",
      earnedAt: Date.now(),
    });

    // Log activity
    await ctx.db.insert("userActivity", {
      userId: args.userId,
      type: "earned_badge",
      badgeName: badgeInfo.name,
      isActive: false,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Check for night owl badge (watching after midnight)
export const checkNightOwlBadge = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return false;

    // Check if already has badge
    const existing = await ctx.db
      .query("badges")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    if (existing.some((b) => b.name === "Night Owl")) {
      return false;
    }

    // Check current hour (this runs on server, so we trust client to call at right time)
    const now = new Date();
    const hour = now.getHours();

    if (hour >= 0 && hour < 5) {
      await ctx.db.insert("badges", {
        userId: user._id,
        name: "Night Owl",
        description: "Watch after midnight",
        icon: "🦉",
        category: "special",
        earnedAt: Date.now(),
      });

      await ctx.db.insert("userActivity", {
        userId: user._id,
        type: "earned_badge",
        badgeName: "Night Owl",
        isActive: false,
        createdAt: Date.now(),
      });

      return true;
    }

    return false;
  },
});
