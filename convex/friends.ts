import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getFriends = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return [];

    const friendships = await ctx.db
      .query("friends")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return Promise.all(
      friendships.map(async (friendship) => {
        const friend = await ctx.db.get(friendship.friendId);
        if (!friend) return null;

        // Check if friend is in a room
        const roomMembership = await ctx.db
          .query("roomMembers")
          .withIndex("by_user", (q) => q.eq("userId", friend._id))
          .first();

        let status: "online" | "offline" | "in-room" = "offline";
        let currentRoom: string | undefined;

        if (roomMembership) {
          const room = await ctx.db.get(roomMembership.roomId);
          if (room) {
            status = "in-room";
            currentRoom = room.name;
          }
        }

        return {
          id: friend._id,
          username: friend.username,
          avatar: friend.avatar,
          avatarColor: friend.avatarColor,
          status,
          currentRoom,
          addedAt: new Date(friendship.addedAt).toISOString(),
        };
      })
    ).then((friends) => friends.filter(Boolean));
  },
});

export const sendFriendRequest = mutation({
  args: { toUserId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    if (user._id.toString() === args.toUserId.toString()) {
      throw new Error("Cannot send friend request to yourself");
    }

    // Check if already friends
    const existingFriendship = await ctx.db
      .query("friends")
      .withIndex("by_both", (q) =>
        q.eq("userId", user._id).eq("friendId", args.toUserId)
      )
      .first();

    if (existingFriendship) {
      throw new Error("Already friends");
    }

    // Check if request already exists
    const existingRequest = await ctx.db
      .query("friendRequests")
      .withIndex("by_from_user", (q) => q.eq("fromUserId", user._id))
      .filter((q) =>
        q.and(
          q.eq(q.field("toUserId"), args.toUserId),
          q.eq(q.field("status"), "pending")
        )
      )
      .first();

    if (existingRequest) {
      throw new Error("Friend request already sent");
    }

    // Check if the other user sent us a request - if so, auto-accept
    const incomingRequest = await ctx.db
      .query("friendRequests")
      .withIndex("by_to_user", (q) => q.eq("toUserId", user._id))
      .filter((q) =>
        q.and(
          q.eq(q.field("fromUserId"), args.toUserId),
          q.eq(q.field("status"), "pending")
        )
      )
      .first();

    if (incomingRequest) {
      // Auto-accept the incoming request
      await ctx.db.patch(incomingRequest._id, {
        status: "accepted",
        respondedAt: Date.now(),
      });

      // Create bidirectional friendship
      await ctx.db.insert("friends", {
        userId: user._id,
        friendId: args.toUserId,
        addedAt: Date.now(),
      });

      await ctx.db.insert("friends", {
        userId: args.toUserId,
        friendId: user._id,
        addedAt: Date.now(),
      });

      return { autoAccepted: true };
    }

    // Create new friend request
    const requestId = await ctx.db.insert("friendRequests", {
      fromUserId: user._id,
      toUserId: args.toUserId,
      status: "pending",
      sentAt: Date.now(),
    });

    // Create notification for the recipient
    const toUser = await ctx.db.get(args.toUserId);
    await ctx.db.insert("notifications", {
      userId: args.toUserId,
      type: "friend_request",
      title: "New Friend Request",
      message: `${user.username} sent you a friend request`,
      read: false,
      data: { requestId, fromUserId: user._id },
      createdAt: Date.now(),
    });

    return { requestId, autoAccepted: false };
  },
});

export const acceptFriendRequest = mutation({
  args: { requestId: v.id("friendRequests") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");

    if (request.toUserId.toString() !== user._id.toString()) {
      throw new Error("Not authorized to accept this request");
    }

    if (request.status !== "pending") {
      throw new Error("Request is no longer pending");
    }

    // Update request status
    await ctx.db.patch(args.requestId, {
      status: "accepted",
      respondedAt: Date.now(),
    });

    // Create bidirectional friendship
    await ctx.db.insert("friends", {
      userId: user._id,
      friendId: request.fromUserId,
      addedAt: Date.now(),
    });

    await ctx.db.insert("friends", {
      userId: request.fromUserId,
      friendId: user._id,
      addedAt: Date.now(),
    });

    // Notify the sender
    await ctx.db.insert("notifications", {
      userId: request.fromUserId,
      type: "friend_request",
      title: "Friend Request Accepted",
      message: `${user.username} accepted your friend request`,
      read: false,
      data: { friendId: user._id },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

export const rejectFriendRequest = mutation({
  args: { requestId: v.id("friendRequests") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");

    if (request.toUserId.toString() !== user._id.toString()) {
      throw new Error("Not authorized to reject this request");
    }

    await ctx.db.patch(args.requestId, {
      status: "rejected",
      respondedAt: Date.now(),
    });

    return { success: true };
  },
});

export const removeFriend = mutation({
  args: { friendId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    // Remove both directions of friendship
    const friendship1 = await ctx.db
      .query("friends")
      .withIndex("by_both", (q) =>
        q.eq("userId", user._id).eq("friendId", args.friendId)
      )
      .first();

    const friendship2 = await ctx.db
      .query("friends")
      .withIndex("by_both", (q) =>
        q.eq("userId", args.friendId).eq("friendId", user._id)
      )
      .first();

    if (friendship1) await ctx.db.delete(friendship1._id);
    if (friendship2) await ctx.db.delete(friendship2._id);

    return { success: true };
  },
});

export const getPendingRequests = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return [];

    const requests = await ctx.db
      .query("friendRequests")
      .withIndex("by_to_user_pending", (q) =>
        q.eq("toUserId", user._id).eq("status", "pending")
      )
      .collect();

    return Promise.all(
      requests.map(async (request) => {
        const fromUser = await ctx.db.get(request.fromUserId);
        return {
          id: request._id,
          fromUserId: request.fromUserId,
          fromUsername: fromUser?.username || "Unknown",
          fromAvatar: fromUser?.avatar,
          fromAvatarColor: fromUser?.avatarColor || "#8B5CF6",
          sentAt: new Date(request.sentAt).toISOString(),
        };
      })
    );
  },
});

export const getSentRequests = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return [];

    const requests = await ctx.db
      .query("friendRequests")
      .withIndex("by_from_user", (q) => q.eq("fromUserId", user._id))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    return Promise.all(
      requests.map(async (request) => {
        const toUser = await ctx.db.get(request.toUserId);
        return {
          id: request._id,
          toUserId: request.toUserId,
          toUsername: toUser?.username || "Unknown",
          toAvatar: toUser?.avatar,
          toAvatarColor: toUser?.avatarColor || "#8B5CF6",
          sentAt: new Date(request.sentAt).toISOString(),
        };
      })
    );
  },
});

export const inviteFriendToRoom = mutation({
  args: {
    friendId: v.id("users"),
    roomId: v.id("rooms"),
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

    // Verify friendship
    const friendship = await ctx.db
      .query("friends")
      .withIndex("by_both", (q) =>
        q.eq("userId", user._id).eq("friendId", args.friendId)
      )
      .first();

    if (!friendship) {
      throw new Error("Not friends with this user");
    }

    // Create notification
    await ctx.db.insert("notifications", {
      userId: args.friendId,
      type: "party_invite",
      title: "Room Invitation",
      message: `${user.username} invited you to join "${room.name}"`,
      read: false,
      data: { roomId: args.roomId, roomName: room.name, fromUserId: user._id },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});
