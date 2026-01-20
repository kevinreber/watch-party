// LocalStorage utility with SSR safety

const isClient = typeof window !== "undefined";

export const storage = {
  get<T>(key: string, defaultValue: T): T {
    if (!isClient) return defaultValue;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    if (!isClient) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      console.error("Failed to save to localStorage");
    }
  },

  remove(key: string): void {
    if (!isClient) return;
    try {
      localStorage.removeItem(key);
    } catch {
      console.error("Failed to remove from localStorage");
    }
  },

  clear(): void {
    if (!isClient) return;
    try {
      localStorage.clear();
    } catch {
      console.error("Failed to clear localStorage");
    }
  },
};

// Storage keys
export const STORAGE_KEYS = {
  // Auth
  CURRENT_USER: "watchparty_current_user",
  AUTH_TOKEN: "watchparty_auth_token",

  // User data
  USER_STATS: "watchparty_user_stats",
  USER_BADGES: "watchparty_user_badges",

  // History
  WATCH_HISTORY: "watchparty_watch_history",
  ROOM_HISTORY: "watchparty_room_history",

  // Favorites & Bookmarks
  FAVORITE_VIDEOS: "watchparty_favorite_videos",
  ROOM_BOOKMARKS: "watchparty_room_bookmarks",

  // Friends
  FRIENDS_LIST: "watchparty_friends",
  FRIEND_REQUESTS: "watchparty_friend_requests",

  // Scheduled parties
  SCHEDULED_PARTIES: "watchparty_scheduled_parties",

  // Theme
  THEME_SETTINGS: "watchparty_theme_settings",

  // Notifications
  NOTIFICATIONS: "watchparty_notifications",

  // Video timestamps
  VIDEO_TIMESTAMPS: "watchparty_video_timestamps",
} as const;
