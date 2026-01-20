// Watch History and Room History Service
import type { WatchHistoryItem, RoomHistory, FavoriteVideo, RoomBookmark, Video } from "~/types";
import { storage, STORAGE_KEYS } from "~/utils/storage";

// Generate a unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const historyService = {
  // ==================
  // Watch History
  // ==================

  getWatchHistory(): WatchHistoryItem[] {
    return storage.get<WatchHistoryItem[]>(STORAGE_KEYS.WATCH_HISTORY, []);
  },

  addToWatchHistory(item: Omit<WatchHistoryItem, "watchedAt">): void {
    const history = historyService.getWatchHistory();
    const newItem: WatchHistoryItem = {
      ...item,
      watchedAt: new Date().toISOString(),
    };

    // Add to beginning of array (most recent first)
    history.unshift(newItem);

    // Keep only last 100 items
    const trimmed = history.slice(0, 100);
    storage.set(STORAGE_KEYS.WATCH_HISTORY, trimmed);
  },

  clearWatchHistory(): void {
    storage.set(STORAGE_KEYS.WATCH_HISTORY, []);
  },

  removeFromWatchHistory(videoId: string, watchedAt: string): void {
    const history = historyService.getWatchHistory();
    const filtered = history.filter(
      h => !(h.videoId === videoId && h.watchedAt === watchedAt)
    );
    storage.set(STORAGE_KEYS.WATCH_HISTORY, filtered);
  },

  // ==================
  // Room History
  // ==================

  getRoomHistory(): RoomHistory[] {
    return storage.get<RoomHistory[]>(STORAGE_KEYS.ROOM_HISTORY, []);
  },

  addRoomVisit(roomId: string, roomName: string): void {
    const history = historyService.getRoomHistory();
    const existingIndex = history.findIndex(h => h.roomId === roomId);

    if (existingIndex !== -1) {
      // Update existing entry
      history[existingIndex].visitedAt = new Date().toISOString();
    } else {
      // Add new entry
      history.unshift({
        roomId,
        roomName,
        visitedAt: new Date().toISOString(),
        watchTime: 0,
        videosWatched: [],
      });
    }

    // Keep only last 50 rooms
    const trimmed = history.slice(0, 50);
    storage.set(STORAGE_KEYS.ROOM_HISTORY, trimmed);
  },

  updateRoomWatchTime(roomId: string, additionalMinutes: number, videoId?: string): void {
    const history = historyService.getRoomHistory();
    const roomIndex = history.findIndex(h => h.roomId === roomId);

    if (roomIndex !== -1) {
      history[roomIndex].watchTime += additionalMinutes;
      if (videoId && !history[roomIndex].videosWatched.includes(videoId)) {
        history[roomIndex].videosWatched.push(videoId);
      }
      storage.set(STORAGE_KEYS.ROOM_HISTORY, history);
    }
  },

  clearRoomHistory(): void {
    storage.set(STORAGE_KEYS.ROOM_HISTORY, []);
  },

  // ==================
  // Favorite Videos
  // ==================

  getFavoriteVideos(): FavoriteVideo[] {
    return storage.get<FavoriteVideo[]>(STORAGE_KEYS.FAVORITE_VIDEOS, []);
  },

  addFavoriteVideo(video: Video): FavoriteVideo {
    const favorites = historyService.getFavoriteVideos();
    const existing = favorites.find(f => f.videoId === video.videoId);

    if (existing) {
      // Increment play count
      existing.playCount++;
      storage.set(STORAGE_KEYS.FAVORITE_VIDEOS, favorites);
      return existing;
    }

    const newFavorite: FavoriteVideo = {
      ...video,
      addedAt: new Date().toISOString(),
      playCount: 1,
    };
    favorites.unshift(newFavorite);
    storage.set(STORAGE_KEYS.FAVORITE_VIDEOS, favorites);
    return newFavorite;
  },

  removeFavoriteVideo(videoId: string): void {
    const favorites = historyService.getFavoriteVideos();
    const filtered = favorites.filter(f => f.videoId !== videoId);
    storage.set(STORAGE_KEYS.FAVORITE_VIDEOS, filtered);
  },

  isFavorite(videoId: string): boolean {
    const favorites = historyService.getFavoriteVideos();
    return favorites.some(f => f.videoId === videoId);
  },

  // ==================
  // Room Bookmarks
  // ==================

  getRoomBookmarks(): RoomBookmark[] {
    return storage.get<RoomBookmark[]>(STORAGE_KEYS.ROOM_BOOKMARKS, []);
  },

  addRoomBookmark(roomId: string, roomName: string): RoomBookmark {
    const bookmarks = historyService.getRoomBookmarks();
    const existing = bookmarks.find(b => b.roomId === roomId);

    if (existing) {
      existing.lastVisited = new Date().toISOString();
      storage.set(STORAGE_KEYS.ROOM_BOOKMARKS, bookmarks);
      return existing;
    }

    const newBookmark: RoomBookmark = {
      roomId,
      roomName,
      bookmarkedAt: new Date().toISOString(),
    };
    bookmarks.unshift(newBookmark);
    storage.set(STORAGE_KEYS.ROOM_BOOKMARKS, bookmarks);
    return newBookmark;
  },

  removeRoomBookmark(roomId: string): void {
    const bookmarks = historyService.getRoomBookmarks();
    const filtered = bookmarks.filter(b => b.roomId !== roomId);
    storage.set(STORAGE_KEYS.ROOM_BOOKMARKS, filtered);
  },

  isRoomBookmarked(roomId: string): boolean {
    const bookmarks = historyService.getRoomBookmarks();
    return bookmarks.some(b => b.roomId === roomId);
  },

  updateBookmarkLastVisited(roomId: string): void {
    const bookmarks = historyService.getRoomBookmarks();
    const bookmarkIndex = bookmarks.findIndex(b => b.roomId === roomId);

    if (bookmarkIndex !== -1) {
      bookmarks[bookmarkIndex].lastVisited = new Date().toISOString();
      storage.set(STORAGE_KEYS.ROOM_BOOKMARKS, bookmarks);
    }
  },
};
