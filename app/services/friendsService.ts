// Friends Service
import type { Friend, FriendRequest, ActivityFeedItem } from "~/types";
import { storage, STORAGE_KEYS } from "~/utils/storage";
import { mockAuth } from "./mockAuth";

// Generate a unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Mock online status (random for demo)
function getRandomStatus(): Friend["status"] {
  const statuses: Friend["status"][] = ["online", "offline", "in-room"];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

export const friendsService = {
  // Get all friends
  getFriends(): Friend[] {
    return storage.get<Friend[]>(STORAGE_KEYS.FRIENDS_LIST, []);
  },

  // Add a friend
  addFriend(friend: Omit<Friend, "addedAt" | "status">): Friend {
    const friends = friendsService.getFriends();
    const newFriend: Friend = {
      ...friend,
      status: getRandomStatus(),
      addedAt: new Date().toISOString(),
    };
    friends.push(newFriend);
    storage.set(STORAGE_KEYS.FRIENDS_LIST, friends);
    return newFriend;
  },

  // Remove a friend
  removeFriend(friendId: string): void {
    const friends = friendsService.getFriends();
    const filtered = friends.filter(f => f.id !== friendId);
    storage.set(STORAGE_KEYS.FRIENDS_LIST, filtered);
  },

  // Update friend status
  updateFriendStatus(friendId: string, status: Friend["status"], currentRoom?: string): void {
    const friends = friendsService.getFriends();
    const friendIndex = friends.findIndex(f => f.id === friendId);
    if (friendIndex !== -1) {
      friends[friendIndex].status = status;
      friends[friendIndex].currentRoom = currentRoom;
      storage.set(STORAGE_KEYS.FRIENDS_LIST, friends);
    }
  },

  // Get online friends
  getOnlineFriends(): Friend[] {
    return friendsService.getFriends().filter(f => f.status !== "offline");
  },

  // Get friend requests
  getFriendRequests(): FriendRequest[] {
    return storage.get<FriendRequest[]>(STORAGE_KEYS.FRIEND_REQUESTS, []);
  },

  // Send friend request
  sendFriendRequest(toUserId: string): FriendRequest {
    const currentUser = mockAuth.getCurrentUser();
    if (!currentUser) {
      throw new Error("Must be logged in to send friend requests");
    }

    const requests = friendsService.getFriendRequests();
    const newRequest: FriendRequest = {
      id: generateId(),
      fromUserId: currentUser.id,
      fromUsername: currentUser.username,
      fromAvatar: currentUser.avatar,
      toUserId,
      sentAt: new Date().toISOString(),
      status: "pending",
    };
    requests.push(newRequest);
    storage.set(STORAGE_KEYS.FRIEND_REQUESTS, requests);
    return newRequest;
  },

  // Accept friend request
  acceptFriendRequest(requestId: string): Friend | null {
    const requests = friendsService.getFriendRequests();
    const requestIndex = requests.findIndex(r => r.id === requestId);

    if (requestIndex === -1) return null;

    const request = requests[requestIndex];
    request.status = "accepted";
    requests[requestIndex] = request;
    storage.set(STORAGE_KEYS.FRIEND_REQUESTS, requests);

    // Add as friend
    return friendsService.addFriend({
      id: request.fromUserId,
      username: request.fromUsername,
      avatar: request.fromAvatar,
      avatarColor: "#6366f1",
    });
  },

  // Reject friend request
  rejectFriendRequest(requestId: string): void {
    const requests = friendsService.getFriendRequests();
    const requestIndex = requests.findIndex(r => r.id === requestId);

    if (requestIndex !== -1) {
      requests[requestIndex].status = "rejected";
      storage.set(STORAGE_KEYS.FRIEND_REQUESTS, requests);
    }
  },

  // Get pending friend requests (received)
  getPendingRequests(): FriendRequest[] {
    const currentUser = mockAuth.getCurrentUser();
    if (!currentUser) return [];

    return friendsService.getFriendRequests().filter(
      r => r.toUserId === currentUser.id && r.status === "pending"
    );
  },

  // Get activity feed (mock data)
  getActivityFeed(): ActivityFeedItem[] {
    const friends = friendsService.getFriends();
    const activities: ActivityFeedItem[] = [];

    // Generate mock activities
    friends.forEach(friend => {
      if (friend.status === "in-room" && friend.currentRoom) {
        activities.push({
          id: generateId(),
          userId: friend.id,
          username: friend.username,
          avatar: friend.avatar,
          type: "watching",
          roomId: friend.currentRoom,
          roomName: friend.currentRoom,
          timestamp: new Date().toISOString(),
        });
      } else if (friend.status === "online") {
        activities.push({
          id: generateId(),
          userId: friend.id,
          username: friend.username,
          avatar: friend.avatar,
          type: "joined_party",
          timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        });
      }
    });

    return activities.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  },

  // Invite friend to room
  inviteFriendToRoom(friendId: string, roomId: string, roomName: string): void {
    // In a real app, this would send a notification to the friend
    console.log(`Invited friend ${friendId} to room ${roomId} (${roomName})`);
    // For now, we'll just log it - in real implementation this would use socket.io
  },

  // Search users (mock - returns sample users for demo)
  searchUsers(query: string): Promise<Array<{id: string; username: string; avatar: string; avatarColor: string}>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock users for demo
        const mockUsers = [
          { id: "user-1", username: "MovieLover42", avatar: "M", avatarColor: "#6366f1" },
          { id: "user-2", username: "CinemaFan", avatar: "C", avatarColor: "#8b5cf6" },
          { id: "user-3", username: "FilmBuff99", avatar: "F", avatarColor: "#ec4899" },
          { id: "user-4", username: "WatchPartyPro", avatar: "W", avatarColor: "#22c55e" },
          { id: "user-5", username: "StreamKing", avatar: "S", avatarColor: "#f59e0b" },
        ];

        const filtered = mockUsers.filter(u =>
          u.username.toLowerCase().includes(query.toLowerCase())
        );
        resolve(filtered);
      }, 300);
    });
  },
};
