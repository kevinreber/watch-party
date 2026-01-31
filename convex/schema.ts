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
    // Role for room permissions
    role: v.optional(
      v.union(v.literal("viewer"), v.literal("cohost"), v.literal("moderator"))
    ),
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
      v.literal("friend_online"),
      // New notification types for retention features
      v.literal("badge_earned"),
      v.literal("level_up"),
      v.literal("challenge_complete"),
      v.literal("streak_warning"),
      v.literal("streak_frozen"),
      v.literal("event_starting"),
      v.literal("event_ending"),
      v.literal("friend_watching"),
      v.literal("weekly_recap"),
      v.literal("milestone_reached")
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

  // ============================================
  // PLAYLISTS
  // ============================================
  playlists: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
    videoCount: v.number(),
    totalDuration: v.optional(v.number()),
    coverImage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_public", ["isPublic"]),

  playlistVideos: defineTable({
    playlistId: v.id("playlists"),
    videoId: v.string(),
    url: v.string(),
    name: v.string(),
    channel: v.optional(v.string()),
    img: v.optional(v.string()),
    duration: v.optional(v.number()),
    position: v.number(),
    addedAt: v.number(),
  })
    .index("by_playlist", ["playlistId"])
    .index("by_playlist_position", ["playlistId", "position"]),

  // ============================================
  // GROUPS / COMMUNITIES
  // ============================================
  groups: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    ownerId: v.id("users"),
    isPublic: v.boolean(),
    memberCount: v.number(),
    avatar: v.optional(v.string()),
    avatarColor: v.string(),
    createdAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_public", ["isPublic"]),

  groupMembers: defineTable({
    groupId: v.id("groups"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
    joinedAt: v.number(),
  })
    .index("by_group", ["groupId"])
    .index("by_user", ["userId"])
    .index("by_group_and_user", ["groupId", "userId"]),

  groupInvites: defineTable({
    groupId: v.id("groups"),
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined")
    ),
    sentAt: v.number(),
    respondedAt: v.optional(v.number()),
  })
    .index("by_group", ["groupId"])
    .index("by_to_user", ["toUserId"])
    .index("by_to_user_pending", ["toUserId", "status"]),

  // ============================================
  // ACTIVITY FEED
  // ============================================
  userActivity: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("watching"),
      v.literal("joined_room"),
      v.literal("created_room"),
      v.literal("started_party"),
      v.literal("added_friend"),
      v.literal("earned_badge"),
      v.literal("created_playlist"),
      v.literal("joined_group")
    ),
    // Activity details
    roomId: v.optional(v.id("rooms")),
    roomName: v.optional(v.string()),
    videoName: v.optional(v.string()),
    friendId: v.optional(v.id("users")),
    friendName: v.optional(v.string()),
    badgeName: v.optional(v.string()),
    playlistId: v.optional(v.id("playlists")),
    playlistName: v.optional(v.string()),
    groupId: v.optional(v.id("groups")),
    groupName: v.optional(v.string()),
    // Metadata
    isActive: v.boolean(), // For "watching" activities, mark when stopped
    createdAt: v.number(),
    endedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isActive"])
    .index("by_created", ["createdAt"])
    .index("by_type", ["type"]),

  // ============================================
  // WATCH STREAKS
  // ============================================
  watchStreaks: defineTable({
    userId: v.id("users"),
    currentStreak: v.number(),
    longestStreak: v.number(),
    lastWatchDate: v.string(), // YYYY-MM-DD format
    streakStartDate: v.string(),
    totalDaysWatched: v.number(),
    // Streak freeze tokens
    freezeTokens: v.optional(v.number()), // Available tokens (max 2)
    lastFreezeUsed: v.optional(v.string()), // Date when last freeze was used
    freezeTokensEarnedThisWeek: v.optional(v.number()), // Tokens earned this week (max 1/week)
    weekStartDate: v.optional(v.string()), // Start of current tracking week
  }).index("by_user", ["userId"]),

  dailyWatchLog: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD format
    watchTime: v.number(), // in seconds
    videosWatched: v.number(),
    roomsVisited: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"]),

  // ============================================
  // ROOM TEMPLATES
  // ============================================
  roomTemplates: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    createdBy: v.optional(v.id("users")), // null for system templates
    isSystem: v.boolean(),
    // Room settings
    isPrivate: v.boolean(),
    maxCapacity: v.number(),
    // Theme
    theme: v.object({
      backgroundColor: v.string(),
      accentColor: v.string(),
      chatBackground: v.string(),
    }),
    // Pre-loaded videos
    videos: v.array(
      v.object({
        videoId: v.string(),
        url: v.string(),
        name: v.string(),
        channel: v.optional(v.string()),
        img: v.optional(v.string()),
      })
    ),
    icon: v.optional(v.string()),
    usageCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_creator", ["createdBy"])
    .index("by_system", ["isSystem"]),

  // ============================================
  // ROOM MODERATION
  // ============================================
  roomBans: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    bannedBy: v.id("users"),
    reason: v.optional(v.string()),
    expiresAt: v.optional(v.number()), // null = permanent
    bannedAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_user", ["userId"])
    .index("by_room_and_user", ["roomId", "userId"]),

  roomMutes: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    mutedBy: v.id("users"),
    expiresAt: v.optional(v.number()),
    mutedAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_room_and_user", ["roomId", "userId"]),

  // ============================================
  // LEADERBOARDS (cached/aggregated)
  // ============================================
  leaderboardEntries: defineTable({
    userId: v.id("users"),
    username: v.string(),
    avatar: v.optional(v.string()),
    avatarColor: v.string(),
    period: v.union(
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("alltime")
    ),
    category: v.union(
      v.literal("watchTime"),
      v.literal("partiesHosted"),
      v.literal("messagesSent"),
      v.literal("reactionsGiven")
    ),
    score: v.number(),
    rank: v.number(),
    updatedAt: v.number(),
  })
    .index("by_period_category", ["period", "category"])
    .index("by_user", ["userId"]),

  // ============================================
  // DAILY CHALLENGES
  // ============================================
  dailyChallenges: defineTable({
    date: v.string(), // YYYY-MM-DD format
    challenges: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        description: v.string(),
        icon: v.string(),
        type: v.union(
          v.literal("watch_time"),
          v.literal("watch_with_friends"),
          v.literal("send_messages"),
          v.literal("send_reactions"),
          v.literal("join_rooms"),
          v.literal("host_party"),
          v.literal("add_to_playlist"),
          v.literal("use_poll")
        ),
        target: v.number(),
        xpReward: v.number(),
        difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
      })
    ),
    createdAt: v.number(),
  }).index("by_date", ["date"]),

  userChallengeProgress: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD format
    challengeId: v.string(),
    progress: v.number(),
    completed: v.boolean(),
    completedAt: v.optional(v.number()),
    xpAwarded: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"])
    .index("by_user_challenge", ["userId", "challengeId"]),

  // ============================================
  // XP & LEVELS SYSTEM
  // ============================================
  userLevels: defineTable({
    userId: v.id("users"),
    currentXp: v.number(),
    totalXp: v.number(),
    level: v.number(),
    title: v.string(), // e.g., "Newbie", "Regular", "Enthusiast", etc.
    lastXpGain: v.optional(
      v.object({
        amount: v.number(),
        reason: v.string(),
        timestamp: v.number(),
      })
    ),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  xpTransactions: defineTable({
    userId: v.id("users"),
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
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_time", ["userId", "createdAt"]),

  // ============================================
  // EVENTS SYSTEM
  // ============================================
  events: defineTable({
    name: v.string(),
    description: v.string(),
    type: v.union(
      v.literal("community_watch"),
      v.literal("marathon"),
      v.literal("challenge_event"),
      v.literal("seasonal"),
      v.literal("special")
    ),
    // Timing
    startsAt: v.number(),
    endsAt: v.number(),
    // Rewards
    xpMultiplier: v.optional(v.number()), // e.g., 2x XP during event
    specialBadgeId: v.optional(v.string()), // Badge earned for participating
    // Content
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
    // Goals for challenge events
    communityGoal: v.optional(
      v.object({
        type: v.string(), // e.g., "total_watch_hours"
        target: v.number(),
        current: v.number(),
      })
    ),
    // Metadata
    image: v.optional(v.string()),
    color: v.string(), // Theme color for event
    createdBy: v.optional(v.id("users")), // null for system events
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_active", ["isActive"])
    .index("by_start", ["startsAt"])
    .index("by_end", ["endsAt"]),

  eventParticipants: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    joinedAt: v.number(),
    // Progress tracking
    watchTime: v.number(), // seconds
    videosWatched: v.number(),
    contribution: v.number(), // For community goals
    // Rewards
    xpEarned: v.number(),
    badgeAwarded: v.boolean(),
  })
    .index("by_event", ["eventId"])
    .index("by_user", ["userId"])
    .index("by_event_user", ["eventId", "userId"]),

  // ============================================
  // INVITE LINKS
  // ============================================
  inviteLinks: defineTable({
    roomId: v.id("rooms"),
    createdBy: v.id("users"),
    code: v.string(), // Short unique code
    // Settings
    maxUses: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    // Stats
    useCount: v.number(),
    // Status
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_room", ["roomId"])
    .index("by_creator", ["createdBy"]),

  inviteLinkUses: defineTable({
    inviteLinkId: v.id("inviteLinks"),
    userId: v.id("users"),
    usedAt: v.number(),
  })
    .index("by_link", ["inviteLinkId"])
    .index("by_user", ["userId"]),

  // ============================================
  // USER ONBOARDING
  // ============================================
  userOnboarding: defineTable({
    userId: v.id("users"),
    // Onboarding steps completed
    steps: v.object({
      profileSetup: v.boolean(),
      firstRoom: v.boolean(),
      firstVideo: v.boolean(),
      firstMessage: v.boolean(),
      firstFriend: v.boolean(),
      firstPlaylist: v.boolean(),
      tutorialComplete: v.boolean(),
    }),
    // Tutorial progress
    currentStep: v.number(),
    // Rewards claimed
    onboardingBadgeClaimed: v.boolean(),
    onboardingXpClaimed: v.boolean(),
    // Metadata
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_user", ["userId"]),
});
