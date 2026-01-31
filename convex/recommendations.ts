import { query } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// ROOM RECOMMENDATIONS
// ============================================

export const getRecommendedRooms = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { friendsRooms: [], popularRooms: [], recentlyVisited: [] };

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return { friendsRooms: [], popularRooms: [], recentlyVisited: [] };

    const limit = args.limit || 5;

    // 1. Rooms where friends are currently watching
    const friendships = await ctx.db
      .query("friends")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const friendIds = friendships.map((f) => f.friendId);

    // Get active watching activities from friends
    const allActive = await ctx.db
      .query("userActivity")
      .withIndex("by_type", (q) => q.eq("type", "watching"))
      .collect();

    const friendsWatching = allActive.filter(
      (a) => a.isActive && friendIds.some((id) => id === a.userId)
    );

    // Get unique room IDs where friends are watching
    const friendRoomIds = [...new Set(friendsWatching.map((a) => a.roomId).filter(Boolean))];

    const friendsRooms = await Promise.all(
      friendRoomIds.slice(0, limit).map(async (roomId) => {
        if (!roomId) return null;
        const room = await ctx.db.get(roomId);
        if (!room) return null;

        // Get friends in this room
        const friendsInRoom = friendsWatching.filter((a) => a.roomId === roomId);
        const friendUsers = await Promise.all(
          friendsInRoom.map(async (a) => {
            const friendUser = await ctx.db.get(a.userId);

            return friendUser
              ? {
                  _id: friendUser._id,
                  username: friendUser.username,
                  avatar: friendUser.avatar,
                  avatarColor: friendUser.avatarColor,
                }
              : null;
          })
        );

        // Get member count
        const members = await ctx.db
          .query("roomMembers")
          .withIndex("by_room", (q) => q.eq("roomId", roomId))
          .collect();

        return {
          ...room,
          friendsInRoom: friendUsers.filter(Boolean),
          memberCount: members.length,
        };
      })
    );

    // 2. Popular rooms (most members, public only)
    const allRooms = await ctx.db.query("rooms").collect();
    const publicRooms = allRooms.filter((r) => !r.isPrivate);

    // Get member counts for all public rooms
    const roomsWithCounts = await Promise.all(
      publicRooms.map(async (room) => {
        const members = await ctx.db
          .query("roomMembers")
          .withIndex("by_room", (q) => q.eq("roomId", room._id))
          .collect();

        // Only include rooms with active members (last active within 5 minutes)
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        const activeMembers = members.filter((m) => m.lastActiveAt > fiveMinutesAgo);

        return {
          ...room,
          memberCount: activeMembers.length,
        };
      })
    );

    // Sort by member count and take top rooms
    const popularRooms = roomsWithCounts
      .filter((r) => r.memberCount > 0)
      .sort((a, b) => b.memberCount - a.memberCount)
      .slice(0, limit);

    // 3. Recently visited rooms
    const roomHistory = await ctx.db
      .query("roomHistory")
      .withIndex("by_user_and_time", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit * 2);

    const recentlyVisited = await Promise.all(
      roomHistory.slice(0, limit).map(async (history) => {
        const room = await ctx.db.get(history.roomId);
        if (!room) return null;

        const members = await ctx.db
          .query("roomMembers")
          .withIndex("by_room", (q) => q.eq("roomId", room._id))
          .collect();

        return {
          ...room,
          lastVisited: history.visitedAt,
          memberCount: members.length,
        };
      })
    );

    return {
      friendsRooms: friendsRooms.filter(Boolean),
      popularRooms,
      recentlyVisited: recentlyVisited.filter(Boolean),
    };
  },
});

// ============================================
// VIDEO RECOMMENDATIONS
// ============================================

export const getRecommendedVideos = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { trending: [], fromHistory: [], friendsWatching: [] };

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return { trending: [], fromHistory: [], friendsWatching: [] };

    const limit = args.limit || 5;

    // 1. Trending videos (most watched across all rooms in last 24 hours)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentHistory = await ctx.db
      .query("watchHistory")
      .filter((q) => q.gt(q.field("watchedAt"), oneDayAgo))
      .collect();

    // Count video occurrences
    const videoCounts = new Map<string, { count: number; video: any }>();
    for (const history of recentHistory) {
      const existing = videoCounts.get(history.videoId);
      if (existing) {
        existing.count++;
      } else {
        videoCounts.set(history.videoId, {
          count: 1,
          video: {
            videoId: history.videoId,
            name: history.videoName,
            channel: history.videoChannel,
            img: history.videoImg,
          },
        });
      }
    }

    const trending = Array.from(videoCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((v) => ({ ...v.video, watchCount: v.count }));

    // 2. Based on user's history (similar channels)
    const userHistory = await ctx.db
      .query("watchHistory")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);

    // Get most watched channels
    const channelCounts = new Map<string, number>();
    for (const history of userHistory) {
      if (history.videoChannel) {
        channelCounts.set(
          history.videoChannel,
          (channelCounts.get(history.videoChannel) || 0) + 1
        );
      }
    }

    const topChannels = Array.from(channelCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([channel]) => channel);

    // Get videos from favorite channels that user hasn't watched
    const watchedVideoIds = new Set(userHistory.map((h) => h.videoId));
    const fromHistory = recentHistory
      .filter(
        (h) =>
          h.videoChannel &&
          topChannels.includes(h.videoChannel) &&
          !watchedVideoIds.has(h.videoId)
      )
      .slice(0, limit)
      .map((h) => ({
        videoId: h.videoId,
        name: h.videoName,
        channel: h.videoChannel,
        img: h.videoImg,
        reason: `Because you watch ${h.videoChannel}`,
      }));

    // 3. What friends are watching now
    const friendships = await ctx.db
      .query("friends")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const friendIds = friendships.map((f) => f.friendId);

    const allActive = await ctx.db
      .query("userActivity")
      .withIndex("by_type", (q) => q.eq("type", "watching"))
      .collect();

    const friendsWatchingNow = allActive.filter(
      (a) => a.isActive && friendIds.some((id) => id === a.userId)
    );

    const friendsWatching = await Promise.all(
      friendsWatchingNow.slice(0, limit).map(async (activity) => {
        const friend = await ctx.db.get(activity.userId);
        const room = activity.roomId ? await ctx.db.get(activity.roomId) : null;

        return {
          videoName: activity.videoName,
          roomId: activity.roomId,
          roomName: activity.roomName,
          friend: friend
            ? {
                _id: friend._id,
                username: friend.username,
                avatar: friend.avatar,
                avatarColor: friend.avatarColor,
              }
            : null,
          currentVideo: room?.currentVideo,
        };
      })
    );

    return {
      trending,
      fromHistory,
      friendsWatching: friendsWatching.filter((f) => f.friend),
    };
  },
});

// ============================================
// CONTINUE WATCHING
// ============================================

export const getContinueWatching = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return null;

    // Get most recent room history
    const recentRoom = await ctx.db
      .query("roomHistory")
      .withIndex("by_user_and_time", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();

    if (!recentRoom) return null;

    // Check if room still exists and has a video
    const room = await ctx.db.get(recentRoom.roomId);
    if (!room) return null;

    // Get current member count
    const members = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", room._id))
      .collect();

    // Check if any friends are in this room
    const friendships = await ctx.db
      .query("friends")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const friendIds = new Set(friendships.map((f) => f.friendId.toString()));

    const friendsInRoom = members.filter((m) => friendIds.has(m.userId.toString()));

    return {
      room: {
        _id: room._id,
        name: room.name,
        currentVideo: room.currentVideo,
        memberCount: members.length,
      },
      lastVisited: recentRoom.visitedAt,
      watchTime: recentRoom.watchTime,
      friendsInRoom: friendsInRoom.length,
    };
  },
});

// ============================================
// PERSONALIZED FEED
// ============================================

export const getPersonalizedFeed = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return [];

    const limit = args.limit || 10;
    const feedItems: Array<{
      type: string;
      priority: number;
      data: any;
      timestamp: number;
    }> = [];

    // Get friend activities
    const friendships = await ctx.db
      .query("friends")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const friendIds = friendships.map((f) => f.friendId);

    if (friendIds.length > 0) {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const friendActivities = await ctx.db
        .query("userActivity")
        .withIndex("by_created", (q) => q.gt("createdAt", oneDayAgo))
        .order("desc")
        .take(100);

      const relevantActivities = friendActivities.filter((a) =>
        friendIds.some((id) => id === a.userId)
      );

      for (const activity of relevantActivities.slice(0, 5)) {
        const friend = await ctx.db.get(activity.userId);
        feedItems.push({
          type: "friend_activity",
          priority: activity.isActive ? 10 : 5,
          data: {
            activity,
            friend: friend
              ? {
                  _id: friend._id,
                  username: friend.username,
                  avatar: friend.avatar,
                  avatarColor: friend.avatarColor,
                }
              : null,
          },
          timestamp: activity.createdAt,
        });
      }
    }

    // Get active events
    const now = Date.now();
    const activeEvents = await ctx.db
      .query("events")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const currentEvents = activeEvents.filter(
      (e) => e.startsAt <= now && e.endsAt >= now
    );

    for (const event of currentEvents) {
      feedItems.push({
        type: "event",
        priority: 8,
        data: { event },
        timestamp: event.startsAt,
      });
    }

    // Get upcoming scheduled parties user is invited to
    const partyInvites = await ctx.db
      .query("partyInvitations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const acceptedInvites = partyInvites.filter((i) => i.status === "accepted");

    for (const invite of acceptedInvites.slice(0, 3)) {
      const party = await ctx.db.get(invite.partyId);
      if (party && party.scheduledFor > now) {
        feedItems.push({
          type: "upcoming_party",
          priority: 7,
          data: { party, invite },
          timestamp: party.scheduledFor,
        });
      }
    }

    // Sort by priority then timestamp
    feedItems.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;

      return b.timestamp - a.timestamp;
    });

    return feedItems.slice(0, limit);
  },
});
