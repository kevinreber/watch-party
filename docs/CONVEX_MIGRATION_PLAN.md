# Convex Migration Plan

> **Decision**: Migrate from localStorage + Ably + in-memory storage to Convex
>
> **Date**: 2026-01-20
>
> **Status**: Approved

## Overview

This document outlines the migration plan from the current architecture to Convex as our unified backend platform.

### Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Current Architecture                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Vercel    │    │    Ably     │    │ localStorage │     │
│  │  (Frontend) │    │ (Real-time) │    │   (Data)     │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                    ┌───────▼───────┐                        │
│                    │  In-Memory    │                        │
│                    │  Maps (Rooms, │                        │
│                    │  Polls, etc.) │                        │
│                    └───────────────┘                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Target Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Target Architecture                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐              ┌─────────────────────────┐  │
│  │   Vercel    │◄────────────►│        Convex           │  │
│  │  (Frontend) │   WebSocket  │  ┌─────────────────┐    │  │
│  └─────────────┘              │  │    Database     │    │  │
│                               │  ├─────────────────┤    │  │
│                               │  │   Functions     │    │  │
│                               │  ├─────────────────┤    │  │
│                               │  │   Real-time     │    │  │
│                               │  ├─────────────────┤    │  │
│                               │  │   Auth (Clerk)  │    │  │
│                               │  └─────────────────┘    │  │
│                               └─────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## What We're Removing

| Service | Purpose | Replaced By |
|---------|---------|-------------|
| **Ably** | Real-time messaging, presence | Convex subscriptions |
| **localStorage** | User data, history, preferences | Convex database |
| **In-memory Maps** | Rooms, polls, video state | Convex database |
| **Mock Auth** | User authentication | Convex + Clerk |
| **API Routes** | Backend endpoints | Convex functions |

## Migration Phases

---

## Phase 1: Foundation Setup (Week 1)

### 1.1 Initialize Convex

```bash
# Install Convex
npm install convex

# Initialize Convex in the project
npx convex init

# Install Clerk for authentication
npm install @clerk/clerk-react
```

### 1.2 Project Structure

```
watch-party/
├── convex/
│   ├── _generated/          # Auto-generated types
│   ├── schema.ts            # Database schema
│   ├── auth.config.ts       # Auth configuration
│   │
│   ├── users.ts             # User functions
│   ├── rooms.ts             # Room functions
│   ├── messages.ts          # Chat functions
│   ├── polls.ts             # Poll functions
│   ├── friends.ts           # Friend functions
│   ├── history.ts           # History functions
│   ├── notifications.ts     # Notification functions
│   ├── scheduledParties.ts  # Scheduled party functions
│   └── videoSync.ts         # Video synchronization
│
├── app/
│   ├── providers/
│   │   └── ConvexProvider.tsx
│   └── ... (existing structure)
```

### 1.3 Database Schema

Create `convex/schema.ts`:

```typescript
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
      mode: v.union(v.literal("light"), v.literal("dark")),
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
    category: v.string(),
    earnedAt: v.number(),
  })
    .index("by_user", ["userId"]),

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
    currentVideo: v.optional(v.object({
      videoId: v.string(),
      url: v.string(),
      name: v.string(),
      channel: v.optional(v.string()),
      img: v.optional(v.string()),
    })),
    videoQueue: v.array(v.object({
      videoId: v.string(),
      url: v.string(),
      name: v.string(),
      channel: v.optional(v.string()),
      img: v.optional(v.string()),
    })),

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
    type: v.union(
      v.literal("message"),
      v.literal("system"),
      v.literal("gif")
    ),
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
    // Auto-expire after 5 seconds (handled by scheduled function)
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
    options: v.array(v.object({
      id: v.string(),
      text: v.string(),
      votes: v.number(),
    })),
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
    videos: v.array(v.object({
      videoId: v.string(),
      url: v.string(),
      name: v.string(),
      channel: v.optional(v.string()),
      img: v.optional(v.string()),
    })),

    // Recurrence
    isRecurring: v.boolean(),
    recurrencePattern: v.optional(
      v.union(
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("monthly")
      )
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
    type: v.string(),
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
```

### 1.4 Convex Provider Setup

Create `app/providers/ConvexProvider.tsx`:

```typescript
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ReactNode } from "react";

const convex = new ConvexReactClient(
  import.meta.env.VITE_CONVEX_URL as string
);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
```

---

## Phase 2: Authentication Migration

### 2.1 Replace Mock Auth with Clerk + Convex

**Current Flow:**
```
mockAuth.ts → localStorage → React Context
```

**New Flow:**
```
Clerk (Google OAuth) → Convex users table → React hooks
```

### 2.2 User Sync Function

Create `convex/users.ts`:

```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Sync user from Clerk on first login
export const syncUser = mutation({
  args: {
    clerkId: v.string(),
    username: v.string(),
    email: v.optional(v.string()),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      return existing._id;
    }

    // Create new user with defaults
    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      username: args.username,
      email: args.email,
      avatar: args.avatar,
      avatarColor: getRandomColor(),
      stats: {
        totalWatchTime: 0,
        videosWatched: 0,
        partiesHosted: 0,
        partiesJoined: 0,
        messagesSent: 0,
        reactionsGiven: 0,
      },
      themeSettings: {
        mode: "dark",
        accentColor: "#8B5CF6",
        soundEffectsEnabled: true,
        soundVolume: 0.5,
      },
      createdAt: Date.now(),
    });
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) =>
        q.eq("clerkId", identity.subject)
      )
      .first();
  },
});

export const updateProfile = mutation({
  args: {
    username: v.optional(v.string()),
    avatar: v.optional(v.string()),
    avatarColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) =>
        q.eq("clerkId", identity.subject)
      )
      .first();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      ...(args.username && { username: args.username }),
      ...(args.avatar && { avatar: args.avatar }),
      ...(args.avatarColor && { avatarColor: args.avatarColor }),
    });
  },
});

function getRandomColor(): string {
  const colors = [
    "#8B5CF6", "#EC4899", "#F59E0B", "#10B981",
    "#3B82F6", "#EF4444", "#6366F1", "#14B8A6",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
```

### 2.3 Update AuthContext

Replace `app/context/AuthContext.tsx` to use Convex:

```typescript
import { createContext, useContext, useEffect, ReactNode } from "react";
import { useUser, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerkAuth();

  const convexUser = useQuery(api.users.getCurrentUser);
  const syncUser = useMutation(api.users.syncUser);

  // Sync Clerk user to Convex on login
  useEffect(() => {
    if (clerkUser && convexUser === null) {
      syncUser({
        clerkId: clerkUser.id,
        username: clerkUser.username || clerkUser.firstName || "User",
        email: clerkUser.primaryEmailAddress?.emailAddress,
        avatar: clerkUser.imageUrl,
      });
    }
  }, [clerkUser, convexUser, syncUser]);

  const isLoading = !clerkLoaded || convexUser === undefined;

  return (
    <AuthContext.Provider
      value={{
        user: convexUser,
        isLoading,
        isLoggedIn: !!convexUser,
        signOut: clerkSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
```

---

## Phase 3: Room & Real-time Migration

### 3.1 Room Functions

Create `convex/rooms.ts`:

```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createRoom = mutation({
  args: {
    name: v.string(),
    isPrivate: v.boolean(),
    password: v.optional(v.string()),
    maxCapacity: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const roomId = await ctx.db.insert("rooms", {
      name: args.name,
      ownerId: user._id,
      isPrivate: args.isPrivate,
      password: args.password,
      maxCapacity: args.maxCapacity,
      isPersistent: false,
      theme: {
        backgroundColor: "#1a1a2e",
        accentColor: "#8B5CF6",
        chatBackground: "#16213e",
      },
      currentVideo: undefined,
      videoQueue: [],
      isPlaying: false,
      currentTime: 0,
      lastSyncAt: Date.now(),
      createdAt: Date.now(),
    });

    // Auto-join the creator
    await ctx.db.insert("roomMembers", {
      roomId,
      userId: user._id,
      joinedAt: Date.now(),
      lastActiveAt: Date.now(),
      isTyping: false,
    });

    // Update user stats
    await ctx.db.patch(user._id, {
      stats: {
        ...user.stats,
        partiesHosted: user.stats.partiesHosted + 1,
      },
    });

    return roomId;
  },
});

export const joinRoom = mutation({
  args: {
    roomId: v.id("rooms"),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    // Check password if private
    if (room.isPrivate && room.password !== args.password) {
      throw new Error("Invalid password");
    }

    // Check capacity
    const members = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    if (members.length >= room.maxCapacity) {
      throw new Error("Room is full");
    }

    // Check if already a member
    const existingMember = members.find((m) => m.userId === user._id);
    if (existingMember) {
      // Update last active time
      await ctx.db.patch(existingMember._id, {
        lastActiveAt: Date.now(),
      });
      return existingMember._id;
    }

    // Join room
    const memberId = await ctx.db.insert("roomMembers", {
      roomId: args.roomId,
      userId: user._id,
      joinedAt: Date.now(),
      lastActiveAt: Date.now(),
      isTyping: false,
    });

    // Update user stats
    await ctx.db.patch(user._id, {
      stats: {
        ...user.stats,
        partiesJoined: user.stats.partiesJoined + 1,
      },
    });

    return memberId;
  },
});

export const leaveRoom = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const member = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", user._id)
      )
      .first();

    if (member) {
      await ctx.db.delete(member._id);
    }

    // Check if room is empty and not persistent
    const room = await ctx.db.get(args.roomId);
    const remainingMembers = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    if (remainingMembers.length === 0 && room && !room.isPersistent) {
      await ctx.db.delete(args.roomId);
    }
  },
});

export const getRoom = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) return null;

    const owner = await ctx.db.get(room.ownerId);
    const members = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    // Get user details for each member
    const membersWithDetails = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        return {
          ...member,
          username: user?.username,
          avatar: user?.avatar,
          avatarColor: user?.avatarColor,
        };
      })
    );

    return {
      ...room,
      ownerName: owner?.username,
      members: membersWithDetails,
      currentUsers: members.length,
    };
  },
});

export const getRoomMembers = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    return Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        return {
          id: member.userId,
          username: user?.username,
          avatar: user?.avatar,
          avatarColor: user?.avatarColor,
          isTyping: member.isTyping,
          joinedAt: member.joinedAt,
        };
      })
    );
  },
});
```

### 3.2 Video Sync Functions

Create `convex/videoSync.ts`:

```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const syncVideoState = mutation({
  args: {
    roomId: v.id("rooms"),
    type: v.union(
      v.literal("play"),
      v.literal("pause"),
      v.literal("seek"),
      v.literal("video-change")
    ),
    currentTime: v.number(),
    video: v.optional(v.object({
      videoId: v.string(),
      url: v.string(),
      name: v.string(),
      channel: v.optional(v.string()),
      img: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    const updates: any = {
      currentTime: args.currentTime,
      lastSyncAt: Date.now(),
    };

    if (args.type === "play") {
      updates.isPlaying = true;
    } else if (args.type === "pause") {
      updates.isPlaying = false;
    } else if (args.type === "video-change" && args.video) {
      updates.currentVideo = args.video;
      updates.currentTime = 0;
      updates.isPlaying = true;
    }

    await ctx.db.patch(args.roomId, updates);
  },
});

export const updateVideoQueue = mutation({
  args: {
    roomId: v.id("rooms"),
    action: v.union(
      v.literal("add"),
      v.literal("remove"),
      v.literal("reorder"),
      v.literal("clear")
    ),
    video: v.optional(v.object({
      videoId: v.string(),
      url: v.string(),
      name: v.string(),
      channel: v.optional(v.string()),
      img: v.optional(v.string()),
    })),
    videos: v.optional(v.array(v.object({
      videoId: v.string(),
      url: v.string(),
      name: v.string(),
      channel: v.optional(v.string()),
      img: v.optional(v.string()),
    }))),
    videoId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    let newQueue = [...room.videoQueue];

    switch (args.action) {
      case "add":
        if (args.video) {
          newQueue.push(args.video);
        }
        break;
      case "remove":
        if (args.videoId) {
          newQueue = newQueue.filter((v) => v.videoId !== args.videoId);
        }
        break;
      case "reorder":
        if (args.videos) {
          newQueue = args.videos;
        }
        break;
      case "clear":
        newQueue = [];
        break;
    }

    await ctx.db.patch(args.roomId, { videoQueue: newQueue });
  },
});

export const getVideoState = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) return null;

    return {
      currentVideo: room.currentVideo,
      videoQueue: room.videoQueue,
      isPlaying: room.isPlaying,
      currentTime: room.currentTime,
      lastSyncAt: room.lastSyncAt,
    };
  },
});
```

### 3.3 Chat Messages

Create `convex/messages.ts`:

```typescript
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const sendMessage = mutation({
  args: {
    roomId: v.id("rooms"),
    type: v.union(v.literal("message"), v.literal("gif")),
    content: v.string(),
    gifUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const messageId = await ctx.db.insert("messages", {
      roomId: args.roomId,
      userId: user._id,
      type: args.type,
      content: args.content,
      gifUrl: args.gifUrl,
      createdAt: Date.now(),
    });

    // Update user stats
    await ctx.db.patch(user._id, {
      stats: {
        ...user.stats,
        messagesSent: user.stats.messagesSent + 1,
      },
    });

    return messageId;
  },
});

export const getMessages = query({
  args: {
    roomId: v.id("rooms"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_room_and_time", (q) => q.eq("roomId", args.roomId))
      .order("desc")
      .take(args.limit || 100);

    // Get user details for each message
    const messagesWithUsers = await Promise.all(
      messages.reverse().map(async (message) => {
        const user = await ctx.db.get(message.userId);
        return {
          ...message,
          username: user?.username,
          avatar: user?.avatar,
          avatarColor: user?.avatarColor,
        };
      })
    );

    return messagesWithUsers;
  },
});

export const setTyping = mutation({
  args: {
    roomId: v.id("rooms"),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return;

    const member = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", user._id)
      )
      .first();

    if (member) {
      await ctx.db.patch(member._id, { isTyping: args.isTyping });
    }
  },
});
```

---

## Phase 4: Service Migration Checklist

### Services to Migrate

| Service | File | Status | Convex File |
|---------|------|--------|-------------|
| mockAuth | `mockAuth.ts` | ⬜ | `users.ts` |
| roomService | `roomService.ts` | ⬜ | `rooms.ts` |
| pollService | `pollService.ts` | ⬜ | `polls.ts` |
| historyService | `historyService.ts` | ⬜ | `history.ts` |
| friendsService | `friendsService.ts` | ⬜ | `friends.ts` |
| scheduledPartyService | `scheduledPartyService.ts` | ⬜ | `scheduledParties.ts` |
| themeService | `themeService.ts` | ⬜ | `users.ts` (prefs) |
| notificationService | `notificationService.ts` | ⬜ | `notifications.ts` |

### Hooks to Update

| Hook | Current | New |
|------|---------|-----|
| `useAbly.ts` | Ably | Convex subscriptions |
| `useHandleMessagesAbly.ts` | Ably | `useQuery(api.messages.getMessages)` |
| `useVideoSyncAbly.ts` | Ably | `useQuery(api.videoSync.getVideoState)` |
| `useGetUserCountAbly.ts` | Ably presence | `useQuery(api.rooms.getRoomMembers)` |
| `useHandleVideoListAbly.ts` | Ably | `useQuery` + `useMutation` |

### API Routes to Remove

After migration, these can be deleted:

- `app/routes/api.ably-auth.ts` - No longer needed
- `app/routes/api.room.ts` - Replaced by Convex mutations
- `app/routes/api.video-state.ts` - Replaced by Convex

Keep:
- `app/routes/api.youtube.ts` - External API, keep as-is

---

## Phase 5: Vercel Integration

### 5.1 Environment Variables

Add to Vercel:

```bash
# Production
CONVEX_DEPLOY_KEY=prod:xxx...

# Preview (separate key)
CONVEX_DEPLOY_KEY=preview:xxx...

# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxx...
CLERK_SECRET_KEY=sk_live_xxx...

# Convex URL (auto-set by deploy command)
VITE_CONVEX_URL=https://xxx.convex.cloud
```

### 5.2 Build Command

Update Vercel build command:

```bash
npx convex deploy --cmd 'npm run build'
```

### 5.3 Remove Ably

After Convex migration is complete:

```bash
npm uninstall ably @ably-labs/react-hooks
```

Remove from Vercel:
- `ABLY_API_KEY`

---

## Migration Order

### Recommended Sequence

```
1. Foundation
   ├── Install Convex & Clerk
   ├── Create schema
   ├── Set up providers
   └── Test locally

2. Authentication
   ├── Implement Clerk + Convex auth
   ├── Migrate AuthContext
   └── Test login/logout

3. Rooms (Core Feature)
   ├── Room CRUD operations
   ├── Member management
   ├── Video state sync
   └── Test room functionality

4. Chat & Real-time
   ├── Messages
   ├── Typing indicators
   ├── Reactions
   └── Test real-time updates

5. Social Features
   ├── Friends system
   ├── Friend requests
   └── Activity feed

6. History & Preferences
   ├── Watch history
   ├── Favorites
   ├── Bookmarks
   ├── Theme settings
   └── Notifications

7. Advanced Features
   ├── Polls
   ├── Scheduled parties
   ├── Video timestamps
   └── Badges

8. Cleanup
   ├── Remove Ably
   ├── Remove localStorage services
   ├── Delete old API routes
   └── Update documentation
```

---

## Rollback Plan

If issues arise during migration:

1. **Feature flags**: Can toggle between old/new systems
2. **Parallel running**: Keep Ably active until Convex is stable
3. **Data export**: Convex supports data export if needed
4. **Vercel rollback**: Can revert to previous deployment

---

## Success Criteria

- [ ] All users can authenticate via Google (Clerk)
- [ ] Rooms create, join, leave work correctly
- [ ] Video sync works across all room members
- [ ] Chat messages persist and sync in real-time
- [ ] Presence shows correct user count
- [ ] Polls work with real-time vote updates
- [ ] Friend system fully functional
- [ ] History and favorites persist correctly
- [ ] No Ably or localStorage dependencies remain
- [ ] Vercel preview deployments work with isolated Convex backends

---

## Resources

- [Convex Documentation](https://docs.convex.dev/)
- [Convex + Clerk Auth](https://docs.convex.dev/auth/clerk)
- [Convex + Vercel](https://docs.convex.dev/production/hosting/vercel)
- [Convex React Hooks](https://docs.convex.dev/client/react)
- [Clerk Documentation](https://clerk.com/docs)
