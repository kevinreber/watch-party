// Mock Authentication Service
import type { User, UserStats, Badge } from "~/types";
import { storage, STORAGE_KEYS } from "~/utils/storage";

const AVATAR_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f59e0b",
  "#22c55e", "#14b8a6", "#3b82f6", "#6366f1", "#a855f7"
];

// Default stats for new users
const defaultStats: UserStats = {
  totalWatchTime: 0,
  videosWatched: 0,
  partiesHosted: 0,
  partiesJoined: 0,
  messagessSent: 0,
  reactionsGiven: 0,
};

// Generate a unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get random avatar color
function getRandomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

// Mock user database (in localStorage)
function getUsers(): User[] {
  return storage.get<User[]>("watchparty_users", []);
}

function saveUsers(users: User[]): void {
  storage.set("watchparty_users", users);
}

export const mockAuth = {
  // Register a new user
  register(username: string, email: string, password: string): Promise<User> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = getUsers();

        // Check if email already exists
        if (users.find(u => u.email === email)) {
          reject(new Error("Email already registered"));
          return;
        }

        // Check if username already exists
        if (users.find(u => u.username === username)) {
          reject(new Error("Username already taken"));
          return;
        }

        const newUser: User = {
          id: generateId(),
          username,
          email,
          avatar: username.charAt(0).toUpperCase(),
          avatarColor: getRandomAvatarColor(),
          createdAt: new Date().toISOString(),
          stats: { ...defaultStats },
          badges: [],
        };

        users.push(newUser);
        saveUsers(users);

        // Save current user
        storage.set(STORAGE_KEYS.CURRENT_USER, newUser);
        storage.set(STORAGE_KEYS.AUTH_TOKEN, `mock-token-${newUser.id}`);

        resolve(newUser);
      }, 500); // Simulate network delay
    });
  },

  // Login
  login(email: string, _password: string): Promise<User> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = getUsers();
        const user = users.find(u => u.email === email);

        if (!user) {
          reject(new Error("Invalid email or password"));
          return;
        }

        // Save current user
        storage.set(STORAGE_KEYS.CURRENT_USER, user);
        storage.set(STORAGE_KEYS.AUTH_TOKEN, `mock-token-${user.id}`);

        resolve(user);
      }, 500);
    });
  },

  // Logout
  logout(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        storage.remove(STORAGE_KEYS.CURRENT_USER);
        storage.remove(STORAGE_KEYS.AUTH_TOKEN);
        resolve();
      }, 200);
    });
  },

  // Get current user
  getCurrentUser(): User | null {
    return storage.get<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  },

  // Check if logged in
  isLoggedIn(): boolean {
    return !!storage.get<string | null>(STORAGE_KEYS.AUTH_TOKEN, null);
  },

  // Update user profile
  updateProfile(updates: Partial<Pick<User, "username" | "avatar" | "avatarColor">>): Promise<User> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const currentUser = mockAuth.getCurrentUser();
        if (!currentUser) {
          reject(new Error("Not logged in"));
          return;
        }

        const users = getUsers();
        const userIndex = users.findIndex(u => u.id === currentUser.id);

        if (userIndex === -1) {
          reject(new Error("User not found"));
          return;
        }

        // Check if new username is taken
        if (updates.username && updates.username !== currentUser.username) {
          if (users.find(u => u.username === updates.username)) {
            reject(new Error("Username already taken"));
            return;
          }
        }

        const updatedUser = { ...users[userIndex], ...updates };
        users[userIndex] = updatedUser;
        saveUsers(users);
        storage.set(STORAGE_KEYS.CURRENT_USER, updatedUser);

        resolve(updatedUser);
      }, 300);
    });
  },

  // Update user stats
  updateStats(statUpdates: Partial<UserStats>): Promise<UserStats> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const currentUser = mockAuth.getCurrentUser();
        if (!currentUser) {
          reject(new Error("Not logged in"));
          return;
        }

        const users = getUsers();
        const userIndex = users.findIndex(u => u.id === currentUser.id);

        if (userIndex === -1) {
          reject(new Error("User not found"));
          return;
        }

        const newStats = {
          ...users[userIndex].stats,
          ...statUpdates,
        };

        // Add stats to existing values
        Object.keys(statUpdates).forEach(key => {
          const k = key as keyof UserStats;
          if (typeof statUpdates[k] === "number") {
            newStats[k] = (users[userIndex].stats[k] || 0) + (statUpdates[k] || 0);
          }
        });

        users[userIndex].stats = newStats;
        saveUsers(users);
        storage.set(STORAGE_KEYS.CURRENT_USER, users[userIndex]);

        // Check for badge achievements
        mockAuth.checkAndAwardBadges(users[userIndex]);

        resolve(newStats);
      }, 200);
    });
  },

  // Check and award badges
  checkAndAwardBadges(user: User): void {
    const badges: Badge[] = [...user.badges];
    const now = new Date().toISOString();

    // Watching badges
    if (user.stats.videosWatched >= 10 && !badges.find(b => b.id === "watcher_10")) {
      badges.push({
        id: "watcher_10",
        name: "First Steps",
        description: "Watched 10 videos",
        icon: "🎬",
        earnedAt: now,
        category: "watching",
      });
    }
    if (user.stats.videosWatched >= 50 && !badges.find(b => b.id === "watcher_50")) {
      badges.push({
        id: "watcher_50",
        name: "Movie Buff",
        description: "Watched 50 videos",
        icon: "🎥",
        earnedAt: now,
        category: "watching",
      });
    }
    if (user.stats.videosWatched >= 100 && !badges.find(b => b.id === "watcher_100")) {
      badges.push({
        id: "watcher_100",
        name: "Binge Master",
        description: "Watched 100 videos",
        icon: "📺",
        earnedAt: now,
        category: "watching",
      });
    }

    // Hosting badges
    if (user.stats.partiesHosted >= 5 && !badges.find(b => b.id === "host_5")) {
      badges.push({
        id: "host_5",
        name: "Party Starter",
        description: "Hosted 5 watch parties",
        icon: "🎉",
        earnedAt: now,
        category: "hosting",
      });
    }
    if (user.stats.partiesHosted >= 25 && !badges.find(b => b.id === "host_25")) {
      badges.push({
        id: "host_25",
        name: "Social Butterfly",
        description: "Hosted 25 watch parties",
        icon: "🦋",
        earnedAt: now,
        category: "hosting",
      });
    }

    // Social badges
    if (user.stats.messagessSent >= 100 && !badges.find(b => b.id === "chat_100")) {
      badges.push({
        id: "chat_100",
        name: "Chatterbox",
        description: "Sent 100 messages",
        icon: "💬",
        earnedAt: now,
        category: "social",
      });
    }
    if (user.stats.reactionsGiven >= 50 && !badges.find(b => b.id === "react_50")) {
      badges.push({
        id: "react_50",
        name: "Reactor",
        description: "Gave 50 reactions",
        icon: "❤️",
        earnedAt: now,
        category: "social",
      });
    }

    // Watch time badges
    if (user.stats.totalWatchTime >= 60 && !badges.find(b => b.id === "time_1h")) {
      badges.push({
        id: "time_1h",
        name: "Time Well Spent",
        description: "Watched for 1 hour total",
        icon: "⏱️",
        earnedAt: now,
        category: "watching",
      });
    }
    if (user.stats.totalWatchTime >= 600 && !badges.find(b => b.id === "time_10h")) {
      badges.push({
        id: "time_10h",
        name: "Dedicated Viewer",
        description: "Watched for 10 hours total",
        icon: "🏆",
        earnedAt: now,
        category: "watching",
      });
    }

    // Update user with new badges
    if (badges.length > user.badges.length) {
      const users = getUsers();
      const userIndex = users.findIndex(u => u.id === user.id);
      if (userIndex !== -1) {
        users[userIndex].badges = badges;
        saveUsers(users);
        storage.set(STORAGE_KEYS.CURRENT_USER, users[userIndex]);
      }
    }
  },

  // Create guest user (for non-logged in users)
  createGuestUser(username: string): User {
    const guestUser: User = {
      id: `guest-${generateId()}`,
      username,
      email: "",
      avatar: username.charAt(0).toUpperCase(),
      avatarColor: getRandomAvatarColor(),
      createdAt: new Date().toISOString(),
      stats: { ...defaultStats },
      badges: [],
    };
    return guestUser;
  },
};
