import { query } from "./_generated/server";
import { v } from "convex/values";

// Helper to format date as YYYY-MM-DD
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);

  return date.toISOString().split("T")[0];
};

// Helper to get date N days ago
const getDaysAgo = (days: number): number => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);

  return date.getTime();
};

// Get dashboard overview stats
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Get all counts
    const users = await ctx.db.query("users").collect();
    const rooms = await ctx.db.query("rooms").collect();
    const messages = await ctx.db.query("messages").collect();
    const badges = await ctx.db.query("badges").collect();
    const friendships = await ctx.db.query("friends").collect();
    const groups = await ctx.db.query("groups").collect();
    const playlists = await ctx.db.query("playlists").collect();
    const watchHistory = await ctx.db.query("watchHistory").collect();
    const roomMembers = await ctx.db.query("roomMembers").collect();

    // Calculate time ranges
    const now = Date.now();
    const dayAgo = getDaysAgo(1);
    const weekAgo = getDaysAgo(7);
    const monthAgo = getDaysAgo(30);

    // Recent activity counts
    const newUsersToday = users.filter((u) => u.createdAt >= dayAgo).length;
    const newUsersThisWeek = users.filter((u) => u.createdAt >= weekAgo).length;
    const newUsersThisMonth = users.filter((u) => u.createdAt >= monthAgo).length;

    const roomsCreatedToday = rooms.filter((r) => r.createdAt >= dayAgo).length;
    const roomsCreatedThisWeek = rooms.filter((r) => r.createdAt >= weekAgo).length;

    const messagesThisWeek = messages.filter((m) => m.createdAt >= weekAgo).length;

    // Active users (users who have room membership activity recently)
    const activeUsersToday = new Set(roomMembers.filter((rm) => rm.lastActiveAt >= dayAgo).map((rm) => rm.userId)).size;
    const activeUsersThisWeek = new Set(
      roomMembers.filter((rm) => rm.lastActiveAt >= weekAgo).map((rm) => rm.userId)
    ).size;

    // Total watch time from user stats
    const totalWatchTime = users.reduce((sum, u) => sum + u.stats.totalWatchTime, 0);
    const totalVideosWatched = users.reduce((sum, u) => sum + u.stats.videosWatched, 0);
    const totalMessagesSent = users.reduce((sum, u) => sum + u.stats.messagesSent, 0);
    const totalReactionsGiven = users.reduce((sum, u) => sum + u.stats.reactionsGiven, 0);

    // Rooms with active members (have had activity in last day)
    const activeRoomIds = new Set(roomMembers.filter((rm) => rm.lastActiveAt >= dayAgo).map((rm) => rm.roomId));

    return {
      overview: {
        totalUsers: users.length,
        totalRooms: rooms.length,
        totalMessages: messages.length,
        totalBadgesAwarded: badges.length,
        totalFriendships: friendships.length,
        totalGroups: groups.length,
        totalPlaylists: playlists.length,
        totalWatchHistoryEntries: watchHistory.length,
      },
      userGrowth: {
        newUsersToday,
        newUsersThisWeek,
        newUsersThisMonth,
      },
      activity: {
        activeUsersToday,
        activeUsersThisWeek,
        activeRoomsToday: activeRoomIds.size,
        roomsCreatedToday,
        roomsCreatedThisWeek,
        messagesThisWeek,
      },
      engagement: {
        totalWatchTimeHours: Math.round(totalWatchTime / 3600),
        totalVideosWatched,
        totalMessagesSent,
        totalReactionsGiven,
        avgWatchTimePerUser: users.length > 0 ? Math.round(totalWatchTime / users.length / 60) : 0, // in minutes
        avgMessagesPerUser: users.length > 0 ? Math.round(totalMessagesSent / users.length) : 0,
      },
    };
  },
});

// Get user growth over time (last 30 days)
export const getUserGrowthChart = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const users = await ctx.db.query("users").collect();
    const thirtyDaysAgo = getDaysAgo(30);

    // Group users by registration date
    const usersByDate: Record<string, number> = {};

    // Initialize all dates in range
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = formatDate(date.getTime());
      usersByDate[dateStr] = 0;
    }

    // Count users per day
    users
      .filter((u) => u.createdAt >= thirtyDaysAgo)
      .forEach((u) => {
        const dateStr = formatDate(u.createdAt);
        if (usersByDate[dateStr] !== undefined) {
          usersByDate[dateStr]++;
        }
      });

    // Convert to array sorted by date
    return Object.entries(usersByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
});

// Get activity chart (messages and room activity over time)
export const getActivityChart = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const messages = await ctx.db.query("messages").collect();
    const rooms = await ctx.db.query("rooms").collect();
    const watchHistory = await ctx.db.query("watchHistory").collect();

    const fourteenDaysAgo = getDaysAgo(14);

    // Initialize data structure
    const activityByDate: Record<string, { messages: number; roomsCreated: number; videosWatched: number }> = {};

    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = formatDate(date.getTime());
      activityByDate[dateStr] = { messages: 0, roomsCreated: 0, videosWatched: 0 };
    }

    // Count messages
    messages
      .filter((m) => m.createdAt >= fourteenDaysAgo)
      .forEach((m) => {
        const dateStr = formatDate(m.createdAt);
        if (activityByDate[dateStr]) {
          activityByDate[dateStr].messages++;
        }
      });

    // Count rooms created
    rooms
      .filter((r) => r.createdAt >= fourteenDaysAgo)
      .forEach((r) => {
        const dateStr = formatDate(r.createdAt);
        if (activityByDate[dateStr]) {
          activityByDate[dateStr].roomsCreated++;
        }
      });

    // Count videos watched
    watchHistory
      .filter((w) => w.watchedAt >= fourteenDaysAgo)
      .forEach((w) => {
        const dateStr = formatDate(w.watchedAt);
        if (activityByDate[dateStr]) {
          activityByDate[dateStr].videosWatched++;
        }
      });

    return Object.entries(activityByDate)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
});

// Get all users with pagination and stats
export const getAllUsers = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    sortBy: v.optional(v.union(v.literal("createdAt"), v.literal("watchTime"), v.literal("messages"))),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const limit = args.limit ?? 50;
    const offset = args.offset ?? 0;
    const sortBy = args.sortBy ?? "createdAt";
    const sortOrder = args.sortOrder ?? "desc";

    let users = await ctx.db.query("users").collect();

    // Sort users
    users.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "watchTime":
          comparison = a.stats.totalWatchTime - b.stats.totalWatchTime;
          break;
        case "messages":
          comparison = a.stats.messagesSent - b.stats.messagesSent;
          break;
        default:
          comparison = a.createdAt - b.createdAt;
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });

    // Get badges counts for each user
    const badges = await ctx.db.query("badges").collect();
    const badgesByUser = badges.reduce(
      (acc, badge) => {
        const key = badge.userId as string;
        acc[key] = (acc[key] || 0) + 1;

        return acc;
      },
      {} as Record<string, number>
    );

    // Get room counts
    const rooms = await ctx.db.query("rooms").collect();
    const roomsByOwner = rooms.reduce(
      (acc, room) => {
        const key = room.ownerId as string;
        acc[key] = (acc[key] || 0) + 1;

        return acc;
      },
      {} as Record<string, number>
    );

    // Paginate
    const paginatedUsers = users.slice(offset, offset + limit);

    return {
      users: paginatedUsers.map((u) => ({
        _id: u._id,
        username: u.username,
        email: u.email,
        avatar: u.avatar,
        avatarColor: u.avatarColor,
        createdAt: u.createdAt,
        stats: u.stats,
        badgeCount: badgesByUser[u._id as string] || 0,
        roomsOwned: roomsByOwner[u._id as string] || 0,
      })),
      total: users.length,
      hasMore: offset + limit < users.length,
    };
  },
});

// Get top users by various metrics
export const getTopUsers = query({
  args: {
    metric: v.union(
      v.literal("watchTime"),
      v.literal("messages"),
      v.literal("partiesHosted"),
      v.literal("reactions"),
      v.literal("streak")
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const limit = args.limit ?? 10;
    const users = await ctx.db.query("users").collect();

    let sortedUsers;
    switch (args.metric) {
      case "watchTime":
        sortedUsers = users.sort((a, b) => b.stats.totalWatchTime - a.stats.totalWatchTime);
        break;
      case "messages":
        sortedUsers = users.sort((a, b) => b.stats.messagesSent - a.stats.messagesSent);
        break;
      case "partiesHosted":
        sortedUsers = users.sort((a, b) => b.stats.partiesHosted - a.stats.partiesHosted);
        break;
      case "reactions":
        sortedUsers = users.sort((a, b) => b.stats.reactionsGiven - a.stats.reactionsGiven);
        break;
      case "streak":
        // For streaks, we need to fetch the watch streak data
        const streaks = await ctx.db.query("watchStreaks").collect();
        const streakByUser = streaks.reduce(
          (acc, s) => {
            acc[s.userId as string] = s.currentStreak;

            return acc;
          },
          {} as Record<string, number>
        );
        sortedUsers = users.sort((a, b) => (streakByUser[b._id as string] || 0) - (streakByUser[a._id as string] || 0));
        break;
      default:
        sortedUsers = users;
    }

    return sortedUsers.slice(0, limit).map((u, index) => ({
      rank: index + 1,
      _id: u._id,
      username: u.username,
      avatar: u.avatar,
      avatarColor: u.avatarColor,
      value:
        args.metric === "watchTime"
          ? u.stats.totalWatchTime
          : args.metric === "messages"
            ? u.stats.messagesSent
            : args.metric === "partiesHosted"
              ? u.stats.partiesHosted
              : args.metric === "reactions"
                ? u.stats.reactionsGiven
                : 0,
    }));
  },
});

// Get room analytics
export const getRoomAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const rooms = await ctx.db.query("rooms").collect();
    const roomMembers = await ctx.db.query("roomMembers").collect();
    const messages = await ctx.db.query("messages").collect();

    const dayAgo = getDaysAgo(1);

    // Group members by room
    const membersByRoom = roomMembers.reduce(
      (acc, rm) => {
        const key = rm.roomId as string;
        if (!acc[key]) acc[key] = [];
        acc[key].push(rm);

        return acc;
      },
      {} as Record<string, typeof roomMembers>
    );

    // Group messages by room
    const messagesByRoom = messages.reduce(
      (acc, m) => {
        const key = m.roomId as string;
        acc[key] = (acc[key] || 0) + 1;

        return acc;
      },
      {} as Record<string, number>
    );

    // Get users for owner names
    const users = await ctx.db.query("users").collect();
    const userMap = users.reduce(
      (acc, u) => {
        acc[u._id as string] = u;

        return acc;
      },
      {} as Record<string, (typeof users)[0]>
    );

    // Analyze rooms
    const roomStats = rooms.map((room) => {
      const members = membersByRoom[room._id as string] || [];
      const activeMembers = members.filter((m) => m.lastActiveAt >= dayAgo);
      const owner = userMap[room.ownerId as string];

      return {
        _id: room._id,
        name: room.name,
        ownerName: owner?.username || "Unknown",
        isPrivate: room.isPrivate,
        isPersistent: room.isPersistent,
        maxCapacity: room.maxCapacity,
        createdAt: room.createdAt,
        totalMembers: members.length,
        activeMembers: activeMembers.length,
        totalMessages: messagesByRoom[room._id as string] || 0,
        hasVideo: !!room.currentVideo,
        queueSize: room.videoQueue.length,
      };
    });

    // Sort by activity (active members + messages)
    roomStats.sort((a, b) => b.activeMembers + b.totalMessages - (a.activeMembers + a.totalMessages));

    // Summary stats
    const publicRooms = rooms.filter((r) => !r.isPrivate).length;
    const privateRooms = rooms.filter((r) => r.isPrivate).length;
    const persistentRooms = rooms.filter((r) => r.isPersistent).length;
    const roomsWithVideo = rooms.filter((r) => r.currentVideo).length;
    const avgMembersPerRoom =
      rooms.length > 0 ? Math.round(roomMembers.length / rooms.length) : 0;

    return {
      summary: {
        totalRooms: rooms.length,
        publicRooms,
        privateRooms,
        persistentRooms,
        roomsWithVideo,
        avgMembersPerRoom,
      },
      rooms: roomStats.slice(0, 50),
    };
  },
});

// Get recent user activity feed
export const getRecentActivity = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const limit = args.limit ?? 50;

    const activities = await ctx.db.query("userActivity").withIndex("by_created").order("desc").take(limit);

    // Get user info for each activity
    const userIds = [...new Set(activities.map((a) => a.userId))];
    const users = await Promise.all(userIds.map((id) => ctx.db.get(id)));
    const userMap = users.reduce(
      (acc, u) => {
        if (u) acc[u._id as string] = u;

        return acc;
      },
      {} as Record<string, NonNullable<(typeof users)[0]>>
    );

    return activities.map((a) => {
      const user = userMap[a.userId as string];

      return {
        _id: a._id,
        type: a.type,
        username: user?.username || "Unknown",
        avatar: user?.avatar,
        avatarColor: user?.avatarColor || "#8B5CF6",
        roomName: a.roomName,
        videoName: a.videoName,
        friendName: a.friendName,
        badgeName: a.badgeName,
        groupName: a.groupName,
        playlistName: a.playlistName,
        createdAt: a.createdAt,
      };
    });
  },
});

// Get badge distribution
export const getBadgeDistribution = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const badges = await ctx.db.query("badges").collect();

    // Group by badge name
    const badgeCounts: Record<string, { name: string; count: number; category: string }> = {};

    badges.forEach((b) => {
      if (!badgeCounts[b.name]) {
        badgeCounts[b.name] = { name: b.name, count: 0, category: b.category };
      }
      badgeCounts[b.name].count++;
    });

    // Group by category
    const byCategory = badges.reduce(
      (acc, b) => {
        acc[b.category] = (acc[b.category] || 0) + 1;

        return acc;
      },
      {} as Record<string, number>
    );

    return {
      badges: Object.values(badgeCounts).sort((a, b) => b.count - a.count),
      byCategory: Object.entries(byCategory).map(([category, count]) => ({
        category,
        count,
      })),
      totalAwarded: badges.length,
    };
  },
});

// Get engagement metrics over time
export const getEngagementMetrics = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const dailyLogs = await ctx.db.query("dailyWatchLog").collect();

    // Group by date for the last 14 days
    const fourteenDaysAgo = getDaysAgo(14);
    const metricsByDate: Record<
      string,
      { watchTime: number; videosWatched: number; roomsVisited: number; activeUsers: number }
    > = {};

    // Initialize dates
    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = formatDate(date.getTime());
      metricsByDate[dateStr] = { watchTime: 0, videosWatched: 0, roomsVisited: 0, activeUsers: 0 };
    }

    // Aggregate daily logs
    const usersByDate: Record<string, Set<string>> = {};

    dailyLogs.forEach((log) => {
      if (metricsByDate[log.date]) {
        metricsByDate[log.date].watchTime += log.watchTime;
        metricsByDate[log.date].videosWatched += log.videosWatched;
        metricsByDate[log.date].roomsVisited += log.roomsVisited;

        if (!usersByDate[log.date]) usersByDate[log.date] = new Set();
        usersByDate[log.date].add(log.userId as string);
      }
    });

    // Set active user counts
    Object.entries(usersByDate).forEach(([date, users]) => {
      if (metricsByDate[date]) {
        metricsByDate[date].activeUsers = users.size;
      }
    });

    return Object.entries(metricsByDate)
      .map(([date, data]) => ({
        date,
        watchTimeHours: Math.round(data.watchTime / 3600),
        videosWatched: data.videosWatched,
        roomsVisited: data.roomsVisited,
        activeUsers: data.activeUsers,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
});

// Search users for admin
export const searchUsersAdmin = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    if (!args.query || args.query.length < 2) return [];

    const users = await ctx.db.query("users").collect();

    const searchLower = args.query.toLowerCase();

    return users
      .filter(
        (user) => user.username.toLowerCase().includes(searchLower) || user.email?.toLowerCase().includes(searchLower)
      )
      .slice(0, 20)
      .map((user) => ({
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        avatarColor: user.avatarColor,
        createdAt: user.createdAt,
        stats: user.stats,
      }));
  },
});

// Get user detail for admin view
export const getUserDetail = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    // Get all related data
    const badges = await ctx.db
      .query("badges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const friends = await ctx.db
      .query("friends")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const roomsOwned = await ctx.db
      .query("rooms")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.userId))
      .collect();

    const watchStreak = await ctx.db
      .query("watchStreaks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const recentActivity = await ctx.db
      .query("userActivity")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(20);

    const recentMessages = await ctx.db.query("messages").order("desc").take(1000);
    const userMessages = recentMessages.filter((m) => m.userId === args.userId).slice(0, 20);

    const playlists = await ctx.db
      .query("playlists")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const userLevel = await ctx.db
      .query("userLevels")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    return {
      user: {
        ...user,
        createdAtFormatted: new Date(user.createdAt).toLocaleDateString(),
      },
      badges,
      friendsCount: friends.length,
      roomsOwned: roomsOwned.length,
      watchStreak,
      recentActivity,
      recentMessages,
      playlistsCount: playlists.length,
      userLevel,
    };
  },
});
