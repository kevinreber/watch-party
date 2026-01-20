// User and Authentication Types
export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  avatarColor: string;
  createdAt: string;
  stats: UserStats;
  badges: Badge[];
}

export interface UserStats {
  totalWatchTime: number; // in minutes
  videosWatched: number;
  partiesHosted: number;
  partiesJoined: number;
  messagessSent: number;
  reactionsGiven: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
  category: "watching" | "hosting" | "social" | "special";
}

// Video Types
export interface Video {
  videoId: string;
  url: string;
  name: string;
  channel?: string;
  description?: string;
  img?: string;
}

export interface FavoriteVideo extends Video {
  addedAt: string;
  playCount: number;
}

// Room Types
export interface Room {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  isPrivate: boolean;
  password?: string;
  maxCapacity: number;
  currentUsers: number;
  createdAt: string;
  theme?: RoomTheme;
  isPersistent: boolean;
}

export interface RoomBookmark {
  roomId: string;
  roomName: string;
  bookmarkedAt: string;
  lastVisited?: string;
}

export interface RoomHistory {
  roomId: string;
  roomName: string;
  visitedAt: string;
  watchTime: number; // in minutes
  videosWatched: string[];
}

export interface RoomTheme {
  backgroundColor: string;
  accentColor: string;
  chatBackground: string;
}

// Watch History Types
export interface WatchHistoryItem {
  videoId: string;
  videoName: string;
  videoChannel?: string;
  videoImg?: string;
  watchedAt: string;
  watchDuration: number; // in seconds
  roomId: string;
  roomName: string;
}

// Friends Types
export interface Friend {
  id: string;
  username: string;
  avatar: string;
  avatarColor: string;
  status: "online" | "offline" | "in-room";
  currentRoom?: string;
  addedAt: string;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUsername: string;
  fromAvatar: string;
  toUserId: string;
  sentAt: string;
  status: "pending" | "accepted" | "rejected";
}

export interface ActivityFeedItem {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  type: "started_party" | "joined_party" | "watching" | "achievement";
  roomId?: string;
  roomName?: string;
  videoName?: string;
  badgeName?: string;
  timestamp: string;
}

// Scheduled Watch Party Types
export interface ScheduledParty {
  id: string;
  name: string;
  description?: string;
  scheduledFor: string;
  createdBy: string;
  creatorName: string;
  roomId: string;
  invitedUsers: string[];
  acceptedUsers: string[];
  videos: Video[];
  isRecurring: boolean;
  recurrencePattern?: "daily" | "weekly" | "monthly";
}

// Reaction Types
export interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  username: string;
  timestamp: number;
  x: number;
  y: number;
}

export type ReactionEmoji = "😂" | "❤️" | "🔥" | "👏" | "😮" | "😢" | "🎉" | "👀";

// Poll Types
export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  createdBy: string;
  creatorName: string;
  createdAt: string;
  endsAt?: string;
  isActive: boolean;
  totalVotes: number;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters: string[];
}

// Theme Types
export type ThemeMode = "dark" | "light" | "system";

export interface ThemeSettings {
  mode: ThemeMode;
  accentColor: string;
  soundEffectsEnabled: boolean;
  soundVolume: number;
}

// Message Types
export interface Message {
  type: "chat" | "admin" | "gif";
  content: string;
  created_at: string;
  userId?: string;
  username: string;
  gifUrl?: string;
}

// Notification Types
export interface Notification {
  id: string;
  type: "friend_request" | "party_invite" | "party_starting" | "friend_online";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: Record<string, unknown>;
}

// Video Timestamp/Bookmark Types
export interface VideoTimestamp {
  id: string;
  videoId: string;
  time: number; // in seconds
  label: string;
  createdBy: string;
  createdAt: string;
}
