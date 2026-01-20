import { useState, useEffect, type CSSProperties } from "react";
import type { RoomBookmark, FavoriteVideo } from "~/types";
import { historyService } from "~/services/historyService";

interface RoomBookmarksProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToRoom?: (roomId: string) => void;
  onPlayVideo?: (videoId: string) => void;
}

export function RoomBookmarks({ isOpen, onClose, onNavigateToRoom, onPlayVideo }: RoomBookmarksProps) {
  const [bookmarks, setBookmarks] = useState<RoomBookmark[]>([]);
  const [favorites, setFavorites] = useState<FavoriteVideo[]>([]);
  const [activeTab, setActiveTab] = useState<"rooms" | "videos">("rooms");

  useEffect(() => {
    if (isOpen) {
      setBookmarks(historyService.getRoomBookmarks());
      setFavorites(historyService.getFavoriteVideos());
    }
  }, [isOpen]);

  const handleRemoveBookmark = (roomId: string) => {
    historyService.removeRoomBookmark(roomId);
    setBookmarks(prev => prev.filter(b => b.roomId !== roomId));
  };

  const handleRemoveFavorite = (videoId: string) => {
    historyService.removeFavoriteVideo(videoId);
    setFavorites(prev => prev.filter(f => f.videoId !== videoId));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose} data-testid="room-bookmarks">
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Saved</h2>
          <button onClick={onClose} style={styles.closeButton}>✕</button>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            onClick={() => setActiveTab("rooms")}
            style={{
              ...styles.tab,
              ...(activeTab === "rooms" ? styles.tabActive : {}),
            }}
          >
            Rooms ({bookmarks.length})
          </button>
          <button
            onClick={() => setActiveTab("videos")}
            style={{
              ...styles.tab,
              ...(activeTab === "videos" ? styles.tabActive : {}),
            }}
          >
            Videos ({favorites.length})
          </button>
        </div>

        <div style={styles.content}>
          {/* Rooms Tab */}
          {activeTab === "rooms" && (
            <div style={styles.list}>
              {bookmarks.length === 0 ? (
                <p style={styles.emptyText}>
                  No bookmarked rooms yet.
                  <br />
                  <span style={styles.emptyHint}>Click the bookmark icon in a room to save it.</span>
                </p>
              ) : (
                bookmarks.map((bookmark) => (
                  <div key={bookmark.roomId} style={styles.bookmarkCard} data-testid={`bookmark-${bookmark.roomId}`}>
                    <div style={styles.bookmarkIcon}>🎥</div>
                    <div style={styles.bookmarkInfo}>
                      <span style={styles.bookmarkName}>{bookmark.roomName}</span>
                      <span style={styles.bookmarkMeta}>
                        Bookmarked {formatDate(bookmark.bookmarkedAt)}
                        {bookmark.lastVisited && ` · Last visit ${formatDate(bookmark.lastVisited)}`}
                      </span>
                    </div>
                    <div style={styles.bookmarkActions}>
                      <button
                        onClick={() => {
                          if (onNavigateToRoom) {
                            onNavigateToRoom(bookmark.roomId);
                            onClose();
                          }
                        }}
                        style={styles.goButton}
                      >
                        Go
                      </button>
                      <button
                        onClick={() => handleRemoveBookmark(bookmark.roomId)}
                        style={styles.removeButton}
                        title="Remove bookmark"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Videos Tab */}
          {activeTab === "videos" && (
            <div style={styles.list}>
              {favorites.length === 0 ? (
                <p style={styles.emptyText}>
                  No favorite videos yet.
                  <br />
                  <span style={styles.emptyHint}>Click the heart icon on videos to save them.</span>
                </p>
              ) : (
                favorites.map((video) => (
                  <div key={video.videoId} style={styles.favoriteCard} data-testid={`favorite-${video.videoId}`}>
                    <div style={styles.thumbnail}>
                      {video.img ? (
                        <img
                          src={video.img}
                          alt={video.name}
                          style={styles.thumbnailImg}
                        />
                      ) : (
                        <div style={styles.thumbnailPlaceholder}>🎬</div>
                      )}
                    </div>
                    <div style={styles.favoriteInfo}>
                      <span style={styles.favoriteName}>{video.name}</span>
                      {video.channel && (
                        <span style={styles.favoriteChannel}>{video.channel}</span>
                      )}
                      <span style={styles.favoriteMeta}>
                        Played {video.playCount} time{video.playCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div style={styles.favoriteActions}>
                      {onPlayVideo && (
                        <button
                          onClick={() => onPlayVideo(video.videoId)}
                          style={styles.playButton}
                          title="Play"
                        >
                          ▶
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveFavorite(video.videoId)}
                        style={styles.removeButton}
                        title="Remove from favorites"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    width: "100%",
    maxWidth: "450px",
    maxHeight: "80vh",
    background: "#1a1a1a",
    borderRadius: "16px",
    border: "1px solid #333",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem 1.5rem",
    borderBottom: "1px solid #333",
  },
  title: {
    margin: 0,
    fontSize: "1.25rem",
    fontWeight: 600,
    color: "#ffffff",
  },
  closeButton: {
    width: "32px",
    height: "32px",
    border: "none",
    background: "#262626",
    borderRadius: "8px",
    color: "#a3a3a3",
    cursor: "pointer",
    fontSize: "1rem",
  },
  tabs: {
    display: "flex",
    borderBottom: "1px solid #333",
  },
  tab: {
    flex: 1,
    padding: "0.75rem",
    background: "transparent",
    border: "none",
    color: "#a3a3a3",
    fontSize: "0.875rem",
    cursor: "pointer",
    borderBottom: "2px solid transparent",
  },
  tabActive: {
    color: "#ffffff",
    borderBottomColor: "#6366f1",
  },
  content: {
    flex: 1,
    overflowY: "auto",
    padding: "1rem",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  emptyText: {
    color: "#737373",
    textAlign: "center",
    padding: "2rem",
    fontSize: "0.875rem",
    lineHeight: 1.6,
  },
  emptyHint: {
    fontSize: "0.75rem",
    color: "#525252",
  },
  bookmarkCard: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.75rem",
    background: "#262626",
    borderRadius: "8px",
  },
  bookmarkIcon: {
    width: "40px",
    height: "40px",
    background: "#404040",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.25rem",
  },
  bookmarkInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  bookmarkName: {
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#ffffff",
  },
  bookmarkMeta: {
    fontSize: "0.75rem",
    color: "#a3a3a3",
  },
  bookmarkActions: {
    display: "flex",
    gap: "0.5rem",
  },
  goButton: {
    padding: "0.5rem 1rem",
    background: "#6366f1",
    border: "none",
    borderRadius: "6px",
    color: "#ffffff",
    fontSize: "0.75rem",
    fontWeight: 500,
    cursor: "pointer",
  },
  removeButton: {
    width: "28px",
    height: "28px",
    border: "none",
    background: "#404040",
    borderRadius: "50%",
    color: "#a3a3a3",
    cursor: "pointer",
    fontSize: "0.75rem",
  },
  favoriteCard: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.75rem",
    background: "#262626",
    borderRadius: "8px",
  },
  thumbnail: {
    width: "80px",
    height: "45px",
    borderRadius: "6px",
    overflow: "hidden",
    flexShrink: 0,
  },
  thumbnailImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  thumbnailPlaceholder: {
    width: "100%",
    height: "100%",
    background: "#404040",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
  },
  favoriteInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  favoriteName: {
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#ffffff",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  favoriteChannel: {
    fontSize: "0.75rem",
    color: "#a3a3a3",
  },
  favoriteMeta: {
    fontSize: "0.75rem",
    color: "#737373",
  },
  favoriteActions: {
    display: "flex",
    gap: "0.5rem",
  },
  playButton: {
    width: "28px",
    height: "28px",
    border: "none",
    background: "#6366f1",
    borderRadius: "50%",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "0.75rem",
  },
};
