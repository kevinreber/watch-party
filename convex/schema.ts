import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============================================
  // USERS & AUTHENTICATION
  // ============================================
  users: defineTable({
    // Clerk user ID
    clerkId: v.string(),

    // Profile
    username: v.string(),
    email: v.optional(v.string()),
    avatar: v.optional(v.string()),
    avatarColor: v.string(),

    // Stats (denormalized for performance)
    stats: v.object({
      totalWatchTime: v.number(),
      videosWatched: v.number(),
      partiesHosted: v.number(),
      partiesJoined: v.number(),
      messagesSent: v.number(),
      reactionsGiven: v.number(),
    }),

    // Preferences
    themeSettings: v.object({
      mode: v.union(v.literal("light"), v.literal("dark"), v.literal("system")),
      accentColor: v.string(),
      soundEffectsEnabled: v.boolean(),
      soundVolume: v.number(),
    }),

    createdAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_username", ["username"]),

  badges: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.string(),
    icon: v.string(),
    category: v.union(
      v.literal("watching"),
      v.literal("hosting"),
      v.literal("social"),
      v.literal("special")
    ),
    earnedAt: v.number(),
  }).index("by_user", ["userId"]),

  // ============================================
  // ROOMS
  // ============================================
  rooms: defineTable({
    name: v.string(),
    ownerId: v.id("users"),

    // Settings
    isPrivate: v.boolean(),
    password: v.optional(v.string()),
    maxCapacity: v.number(),
    isPersistent: v.boolean(),

    // Theme
    theme: v.object({
      backgroundColor: v.string(),
      accentColor: v.string(),
      chatBackground: v.string(),
    }),

    // Video state
    currentVideo: v.optional(
      v.object({
        videoId: v.string(),
        url: v.string(),
        name: v.string(),
        channel: v.optional(v.string()),
        img: v.optional(v.string()),
      })
    ),
    videoQueue: v.array(
      v.object({
        videoId: v.string(),
        url: v.string(),
        name: v.string(),
        channel: v.optional(v.string()),
        img: v.optional(v.string()),
      })
    ),

    // Playback state
    isPlaying: v.boolean(),
    currentTime: v.number(),
    lastSyncAt: v.number(),

    createdAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_persistent", ["isPersistent"]),

  roomMembers: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    joinedAt: v.number(),
    lastActiveAt: v.number(),
    isTyping: v.boolean(),
  })
    .index("by_room", ["roomId"])
    .index("by_user", ["userId"])
    .index("by_room_and_user", ["roomId", "userId"]),

  // ============================================
  // CHAT & MESSAGES
  // ============================================
  messages: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    type: v.union(v.literal("chat"), v.literal("admin"), v.literal("gif")),
    content: v.string(),
    gifUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_room_and_time", ["roomId", "createdAt"]),

  reactions: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    emoji: v.string(),
    x: v.number(),
    y: v.number(),
    createdAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_created", ["createdAt"]),

  // ============================================
  // POLLS
  // ============================================
  polls: defineTable({
    roomId: v.id("rooms"),
    createdBy: v.id("users"),
    question: v.string(),
    options: v.array(
      v.object({
        id: v.string(),
        text: v.string(),
        votes: v.number(),
      })
    ),
    isActive: v.boolean(),
    endsAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_room_active", ["roomId", "isActive"]),

  pollVotes: defineTable({
    pollId: v.id("polls"),
    optionId: v.string(),
    userId: v.id("users"),
    votedAt: v.number(),
  })
    .index("by_poll", ["pollId"])
    .index("by_poll_and_user", ["pollId", "userId"]),

  // ============================================
  // SOCIAL / FRIENDS
  // ============================================
  friends: defineTable({
    userId: v.id("users"),
    friendId: v.id("users"),
    addedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_friend", ["friendId"])
    .index("by_both", ["userId", "friendId"]),

  friendRequests: defineTable({
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected")
    ),
    sentAt: v.number(),
    respondedAt: v.optional(v.number()),
  })
    .index("by_to_user", ["toUserId"])
    .index("by_from_user", ["fromUserId"])
    .index("by_to_user_pending", ["toUserId", "status"]),

  // ============================================
  // HISTORY & FAVORITES
  // ============================================
  watchHistory: defineTable({
    userId: v.id("users"),
    videoId: v.string(),
    videoName: v.string(),
    videoChannel: v.optional(v.string()),
    videoImg: v.optional(v.string()),
    roomId: v.optional(v.id("rooms")),
    roomName: v.optional(v.string()),
    watchDuration: v.number(),
    watchedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_time", ["userId", "watchedAt"]),

  roomHistory: defineTable({
    userId: v.id("users"),
    roomId: v.id("rooms"),
    roomName: v.string(),
    watchTime: v.number(),
    videosWatched: v.number(),
    visitedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_time", ["userId", "visitedAt"]),

  favoriteVideos: defineTable({
    userId: v.id("users"),
    videoId: v.string(),
    url: v.string(),
    name: v.string(),
    channel: v.optional(v.string()),
    img: v.optional(v.string()),
    playCount: v.number(),
    addedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_video", ["userId", "videoId"]),

  roomBookmarks: defineTable({
    userId: v.id("users"),
    roomId: v.id("rooms"),
    roomName: v.string(),
    bookmarkedAt: v.number(),
    lastVisited: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_room", ["userId", "roomId"]),

  // ============================================
  // SCHEDULED PARTIES
  // ============================================
  scheduledParties: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    createdBy: v.id("users"),
    scheduledFor: v.number(),
    roomId: v.optional(v.id("rooms")),

    // Videos to watch
    videos: v.array(
      v.object({
        videoId: v.string(),
        url: v.string(),
        name: v.string(),
        channel: v.optional(v.string()),
        img: v.optional(v.string()),
      })
    ),

    // Recurrence
    isRecurring: v.boolean(),
    recurrencePattern: v.optional(
      v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"))
    ),

    createdAt: v.number(),
  })
    .index("by_creator", ["createdBy"])
    .index("by_scheduled_time", ["scheduledFor"]),

  partyInvitations: defineTable({
    partyId: v.id("scheduledParties"),
    userId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined")
    ),
    invitedAt: v.number(),
    respondedAt: v.optional(v.number()),
  })
    .index("by_party", ["partyId"])
    .index("by_user", ["userId"])
    .index("by_user_pending", ["userId", "status"]),

  // ============================================
  // NOTIFICATIONS
  // ============================================
  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("friend_request"),
      v.literal("party_invite"),
      v.literal("party_starting"),
      v.literal("friend_online")
    ),
    title: v.string(),
    message: v.string(),
    read: v.boolean(),
    data: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "read"])
    .index("by_user_and_time", ["userId", "createdAt"]),

  // ============================================
  // VIDEO TIMESTAMPS
  // ============================================
  videoTimestamps: defineTable({
    videoId: v.string(),
    userId: v.id("users"),
    time: v.number(),
    label: v.string(),
    createdAt: v.number(),
  })
    .index("by_video", ["videoId"])
    .index("by_user", ["userId"]),
});
