import { type CSSProperties } from "react";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { Link } from "react-router";

export const ContinueWatching = () => {
  const continueData = useQuery(api.recommendations.getContinueWatching);

  if (!continueData || !continueData.room) {
    return null;
  }

  const { room, lastVisited, watchTime, friendsInRoom } = continueData;

  return (
    <Link to={`/room/${room._id}`} style={styles.container}>
      <div style={styles.content}>
        <div style={styles.thumbnail}>
          {room.currentVideo?.img ? (
            <img
              src={room.currentVideo.img}
              alt=""
              style={styles.thumbnailImg}
            />
          ) : (
            <div style={styles.thumbnailPlaceholder}>
              <span style={styles.playIcon}>▶</span>
            </div>
          )}
          <div style={styles.overlay}>
            <span style={styles.overlayText}>Continue</span>
          </div>
        </div>

        <div style={styles.info}>
          <div style={styles.header}>
            <span style={styles.label}>Continue Watching</span>
            <span style={styles.time}>{formatTimeAgo(lastVisited)}</span>
          </div>

          <h3 style={styles.roomName}>{room.name}</h3>

          {room.currentVideo && (
            <p style={styles.videoName}>{room.currentVideo.name}</p>
          )}

          <div style={styles.meta}>
            {room.memberCount > 0 && (
              <span style={styles.metaItem}>
                <span style={styles.metaIcon}>👥</span>
                {room.memberCount} watching
              </span>
            )}
            {friendsInRoom > 0 && (
              <span style={{ ...styles.metaItem, ...styles.friendsMeta }}>
                <span style={styles.metaIcon}>💚</span>
                {friendsInRoom} friend{friendsInRoom !== 1 ? "s" : ""} here
              </span>
            )}
            {watchTime > 0 && (
              <span style={styles.metaItem}>
                <span style={styles.metaIcon}>⏱</span>
                {formatWatchTime(watchTime)} watched
              </span>
            )}
          </div>
        </div>

        <div style={styles.arrow}>→</div>
      </div>
    </Link>
  );
};

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;

  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.round(diff / 3600000)}h ago`;

  return `${Math.round(diff / 86400000)}d ago`;
}

function formatWatchTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

const styles: Record<string, CSSProperties> = {
  container: {
    display: "block",
    textDecoration: "none",
    color: "inherit",
    backgroundColor: "#1a1a1a",
    borderRadius: "12px",
    overflow: "hidden",
    transition: "all 0.2s ease",
    border: "1px solid #262626",
  },
  content: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "12px",
  },
  thumbnail: {
    position: "relative",
    width: "120px",
    height: "68px",
    borderRadius: "8px",
    overflow: "hidden",
    flexShrink: 0,
    backgroundColor: "#262626",
  },
  thumbnailImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  thumbnailPlaceholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #262626 0%, #1a1a1a 100%)",
  },
  playIcon: {
    fontSize: "24px",
    color: "#8B5CF6",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(139, 92, 246, 0.9)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0,
    transition: "opacity 0.2s ease",
  },
  overlayText: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#fff",
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "4px",
  },
  label: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#8B5CF6",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  time: {
    fontSize: "11px",
    color: "#666",
  },
  roomName: {
    margin: "0 0 4px 0",
    fontSize: "16px",
    fontWeight: "600",
    color: "#fff",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  videoName: {
    margin: "0 0 8px 0",
    fontSize: "13px",
    color: "#888",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  meta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "12px",
    color: "#666",
  },
  friendsMeta: {
    color: "#22c55e",
  },
  metaIcon: {
    fontSize: "12px",
  },
  arrow: {
    fontSize: "20px",
    color: "#8B5CF6",
    opacity: 0.5,
    transition: "all 0.2s ease",
  },
};

// Add hover styles via CSS
if (typeof document !== "undefined") {
  const existingStyle = document.querySelector("style[data-continue-watching]");
  if (!existingStyle) {
    const styleSheet = document.createElement("style");
    styleSheet.setAttribute("data-continue-watching", "true");
    styleSheet.textContent = `
      a[href*="/room/"]:hover .continue-watching-overlay,
      a[href*="/room/"]:hover [style*="opacity: 0"] {
        opacity: 1 !important;
      }
      a[href*="/room/"]:hover [style*="opacity: 0.5"] {
        opacity: 1 !important;
        transform: translateX(4px);
      }
    `;
    document.head.appendChild(styleSheet);
  }
}
