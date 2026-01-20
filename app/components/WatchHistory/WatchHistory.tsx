import { useState, useEffect, type CSSProperties } from "react";
import type { WatchHistoryItem, RoomHistory } from "~/types";
import { historyService } from "~/services/historyService";

interface WatchHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayVideo?: (videoId: string) => void;
}

export function WatchHistory({ isOpen, onClose, onPlayVideo }: WatchHistoryProps) {
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [roomHistory, setRoomHistory] = useState<RoomHistory[]>([]);
  const [activeTab, setActiveTab] = useState<"videos" | "rooms">("videos");

  useEffect(() => {
    if (isOpen) {
      setWatchHistory(historyService.getWatchHistory());
      setRoomHistory(historyService.getRoomHistory());
    }
  }, [isOpen]);

  const handleClearWatchHistory = () => {
    historyService.clearWatchHistory();
    setWatchHistory([]);
  };

  const handleClearRoomHistory = () => {
    historyService.clearRoomHistory();
    setRoomHistory([]);
  };

  const handleRemoveFromHistory = (videoId: string, watchedAt: string) => {
    historyService.removeFromWatchHistory(videoId, watchedAt);
    setWatchHistory(prev =>
      prev.filter(h => !(h.videoId === videoId && h.watchedAt === watchedAt))
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.round(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.round(diff / 3600000)} hours ago`;
    if (diff < 604800000) return `${Math.round(diff / 86400000)} days ago`;

    return date.toLocaleDateString();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose} data-testid="watch-history">
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>History</h2>
          <button onClick={onClose} style={styles.closeButton}>✕</button>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            onClick={() => setActiveTab("videos")}
            style={{
              ...styles.tab,
              ...(activeTab === "videos" ? styles.tabActive : {}),
            }}
          >
            Videos ({watchHistory.length})
          </button>
          <button
            onClick={() => setActiveTab("rooms")}
            style={{
              ...styles.tab,
              ...(activeTab === "rooms" ? styles.tabActive : {}),
            }}
          >
            Rooms ({roomHistory.length})
          </button>
        </div>

        <div style={styles.content}>
          {/* Videos Tab */}
          {activeTab === "videos" && (
            <>
              {watchHistory.length > 0 && (
                <button
                  onClick={handleClearWatchHistory}
                  style={styles.clearButton}
                >
                  Clear History
                </button>
              )}
              <div style={styles.list}>
                {watchHistory.length === 0 ? (
                  <p style={styles.emptyText}>No watch history yet</p>
                ) : (
                  watchHistory.map((item, index) => (
                    <div key={`${item.videoId}-${index}`} style={styles.historyCard}>
                      <div style={styles.thumbnail}>
                        {item.videoImg ? (
                          <img
                            src={item.videoImg}
                            alt={item.videoName}
                            style={styles.thumbnailImg}
                          />
                        ) : (
                          <div style={styles.thumbnailPlaceholder}>🎬</div>
                        )}
                      </div>
                      <div style={styles.historyInfo}>
                        <span style={styles.historyTitle}>{item.videoName}</span>
                        {item.videoChannel && (
                          <span style={styles.historyChannel}>{item.videoChannel}</span>
                        )}
                        <span style={styles.historyMeta}>
                          {formatDate(item.watchedAt)} · {formatDuration(item.watchDuration)} watched
                        </span>
                      </div>
                      <div style={styles.historyActions}>
                        {onPlayVideo && (
                          <button
                            onClick={() => onPlayVideo(item.videoId)}
                            style={styles.playButton}
                            title="Play again"
                          >
                            ▶
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveFromHistory(item.videoId, item.watchedAt)}
                          style={styles.removeButton}
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* Rooms Tab */}
          {activeTab === "rooms" && (
            <>
              {roomHistory.length > 0 && (
                <button
                  onClick={handleClearRoomHistory}
                  style={styles.clearButton}
                >
                  Clear History
                </button>
              )}
              <div style={styles.list}>
                {roomHistory.length === 0 ? (
                  <p style={styles.emptyText}>No room history yet</p>
                ) : (
                  roomHistory.map((room) => (
                    <div key={room.roomId} style={styles.roomCard}>
                      <div style={styles.roomIcon}>🎥</div>
                      <div style={styles.roomInfo}>
                        <span style={styles.roomName}>{room.roomName}</span>
                        <span style={styles.roomMeta}>
                          Last visited {formatDate(room.visitedAt)} · {room.videosWatched.length} videos
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          onClose();
                          window.location.href = `/room/${room.roomId}`;
                        }}
                        style={styles.visitButton}
                      >
                        Visit
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
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
    maxWidth: "500px",
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
  clearButton: {
    width: "100%",
    padding: "0.5rem",
    background: "transparent",
    border: "1px solid #404040",
    borderRadius: "6px",
    color: "#a3a3a3",
    fontSize: "0.75rem",
    cursor: "pointer",
    marginBottom: "1rem",
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
  },
  historyCard: {
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
  historyInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  historyTitle: {
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#ffffff",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  historyChannel: {
    fontSize: "0.75rem",
    color: "#a3a3a3",
  },
  historyMeta: {
    fontSize: "0.75rem",
    color: "#737373",
  },
  historyActions: {
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
  roomCard: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.75rem",
    background: "#262626",
    borderRadius: "8px",
  },
  roomIcon: {
    width: "40px",
    height: "40px",
    background: "#404040",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.25rem",
  },
  roomInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  roomName: {
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#ffffff",
  },
  roomMeta: {
    fontSize: "0.75rem",
    color: "#a3a3a3",
  },
  visitButton: {
    padding: "0.5rem 1rem",
    background: "#6366f1",
    border: "none",
    borderRadius: "6px",
    color: "#ffffff",
    fontSize: "0.75rem",
    fontWeight: 500,
    cursor: "pointer",
  },
};
