interface Video {
  videoId: string;
  url: string;
  name: string;
  channel?: string;
  description?: string;
  img?: string;
}

interface WatchListProps {
  videos: Video[];
  removeVideo: (video: Video) => void;
}

export const WatchList = ({ videos, removeVideo }: WatchListProps) => {
  if (videos.length === 0) {
    return (
      <div style={styles.emptyState}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <rect width="48" height="48" rx="12" fill="#262626" />
          <path
            d="M20 18L32 24L20 30V18Z"
            stroke="#404040"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
        <p style={styles.emptyText}>Queue is empty</p>
        <p style={styles.emptySubtext}>
          Search for videos above to add them to the queue
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.queueHeader}>
        <span style={styles.queueLabel}>Up next</span>
        <span style={styles.queueCount}>{videos.length} videos</span>
      </div>

      <div style={styles.list}>
        {videos.map((video, index) => (
          <div
            key={video.videoId}
            style={{
              ...styles.item,
              ...(index === 0 ? styles.itemNowPlaying : {}),
            }}
          >
            {/* Position indicator */}
            <div style={{
              ...styles.position,
              ...(index === 0 ? styles.positionActive : {}),
            }}>
              {index === 0 ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M5 3L13 8L5 13V3Z" fill="currentColor" />
                </svg>
              ) : (
                index + 1
              )}
            </div>

            {/* Thumbnail */}
            <div style={styles.thumbnailWrapper}>
              <img
                src={video.img || `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`}
                alt={video.name}
                style={styles.thumbnail}
              />
              {index === 0 && (
                <div style={styles.nowPlayingBadge}>
                  <span style={styles.nowPlayingDot} />
                  NOW PLAYING
                </div>
              )}
            </div>

            {/* Info */}
            <div style={styles.info}>
              <span style={styles.title}>{video.name}</span>
              {video.channel && (
                <span style={styles.channel}>{video.channel}</span>
              )}
            </div>

            {/* Remove button */}
            <button
              onClick={() => removeVideo(video)}
              style={styles.removeButton}
              aria-label="Remove from queue"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M13.5 4.5L4.5 13.5M4.5 4.5L13.5 13.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  queueHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem",
    borderBottom: "1px solid #262626",
  },
  queueLabel: {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#ffffff",
  },
  queueCount: {
    fontSize: "0.8125rem",
    color: "#737373",
  },
  list: {
    flex: 1,
    overflowY: "auto",
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.75rem 1rem",
    borderBottom: "1px solid #262626",
    transition: "background 0.15s ease",
  },
  itemNowPlaying: {
    background: "rgba(99, 102, 241, 0.1)",
  },
  position: {
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#525252",
    flexShrink: 0,
  },
  positionActive: {
    color: "#6366f1",
  },
  thumbnailWrapper: {
    position: "relative",
    width: "80px",
    height: "45px",
    borderRadius: "6px",
    overflow: "hidden",
    flexShrink: 0,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  nowPlayingBadge: {
    position: "absolute",
    bottom: "4px",
    left: "4px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "2px 6px",
    background: "rgba(0, 0, 0, 0.8)",
    borderRadius: "4px",
    fontSize: "0.625rem",
    fontWeight: 600,
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: "0.025em",
  },
  nowPlayingDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#ef4444",
    animation: "pulse 1.5s infinite",
  },
  info: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "0.125rem",
    minWidth: 0,
  },
  title: {
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#ffffff",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    lineHeight: 1.3,
  },
  channel: {
    fontSize: "0.75rem",
    color: "#737373",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  removeButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    background: "transparent",
    border: "none",
    borderRadius: "6px",
    color: "#525252",
    cursor: "pointer",
    transition: "all 0.15s ease",
    flexShrink: 0,
  },
  emptyState: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
    padding: "2rem",
  },
  emptyText: {
    fontSize: "1rem",
    fontWeight: 500,
    color: "#737373",
    margin: 0,
  },
  emptySubtext: {
    fontSize: "0.875rem",
    color: "#525252",
    margin: 0,
    textAlign: "center",
  },
};

// Inject hover styles and pulse animation
const watchListStyles = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

if (typeof document !== "undefined") {
  const styleEl = document.createElement("style");
  styleEl.textContent = watchListStyles;
  document.head.appendChild(styleEl);
}
