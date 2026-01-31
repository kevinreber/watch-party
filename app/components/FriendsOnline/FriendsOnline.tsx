import { type CSSProperties } from "react";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { Link } from "react-router";

interface FriendsOnlineProps {
  compact?: boolean;
  maxDisplay?: number;
}

export const FriendsOnline = ({ compact = false, maxDisplay = 5 }: FriendsOnlineProps) => {
  const activeWatchers = useQuery(api.activity.getActiveWatchers);

  if (!activeWatchers || activeWatchers.length === 0) {
    if (compact) return null;

    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.headerIcon}>👥</span>
          <span style={styles.title}>Friends Watching</span>
        </div>
        <div style={styles.empty}>
          <span style={styles.emptyText}>No friends are watching right now</span>
        </div>
      </div>
    );
  }

  if (compact) {
    const displayedWatchers = activeWatchers.slice(0, 3);
    const remaining = activeWatchers.length - displayedWatchers.length;

    return (
      <div style={styles.compactContainer}>
        <span style={styles.compactIndicator} />
        <div style={styles.compactAvatars}>
          {displayedWatchers.map((watcher, index) => (
            <div
              key={watcher._id}
              style={{
                ...styles.compactAvatar,
                backgroundColor: watcher.user?.avatarColor || "#8B5CF6",
                marginLeft: index > 0 ? "-8px" : "0",
                zIndex: displayedWatchers.length - index,
              }}
            >
              {watcher.user?.avatar ? (
                <img
                  src={watcher.user.avatar}
                  alt=""
                  style={styles.compactAvatarImg}
                />
              ) : (
                <span style={styles.compactAvatarText}>
                  {watcher.user?.username?.[0]?.toUpperCase() || "?"}
                </span>
              )}
            </div>
          ))}
          {remaining > 0 && (
            <div style={{ ...styles.compactAvatar, ...styles.compactAvatarMore }}>
              +{remaining}
            </div>
          )}
        </div>
        <span style={styles.compactText}>watching</span>
      </div>
    );
  }

  const displayedWatchers = activeWatchers.slice(0, maxDisplay);
  const remaining = activeWatchers.length - displayedWatchers.length;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerIcon}>👥</span>
          <span style={styles.title}>Friends Watching</span>
        </div>
        <span style={styles.onlineCount}>
          <span style={styles.onlineDot} />
          {activeWatchers.length} online
        </span>
      </div>

      <div style={styles.watcherList}>
        {displayedWatchers.map((watcher) => (
          <WatcherCard key={watcher._id} watcher={watcher} />
        ))}

        {remaining > 0 && (
          <div style={styles.moreCard}>
            <span style={styles.moreText}>+{remaining} more friends watching</span>
          </div>
        )}
      </div>
    </div>
  );
};

interface WatcherCardProps {
  watcher: {
    _id: string;
    roomId?: string;
    roomName?: string;
    videoName?: string;
    user: {
      _id: string;
      username: string;
      avatar?: string;
      avatarColor: string;
    } | null;
  };
}

const WatcherCard = ({ watcher }: WatcherCardProps) => {
  if (!watcher.user) return null;

  const content = (
    <div style={styles.watcherCard}>
      <div
        style={{
          ...styles.watcherAvatar,
          backgroundColor: watcher.user.avatarColor,
        }}
      >
        {watcher.user.avatar ? (
          <img src={watcher.user.avatar} alt="" style={styles.watcherAvatarImg} />
        ) : (
          <span style={styles.watcherAvatarText}>
            {watcher.user.username[0].toUpperCase()}
          </span>
        )}
        <span style={styles.watcherOnlineDot} />
      </div>

      <div style={styles.watcherInfo}>
        <span style={styles.watcherName}>{watcher.user.username}</span>
        <span style={styles.watcherRoom}>
          {watcher.roomName ? `in ${watcher.roomName}` : "Watching"}
        </span>
        {watcher.videoName && (
          <span style={styles.watcherVideo}>{watcher.videoName}</span>
        )}
      </div>

      <div style={styles.watcherAction}>
        <span style={styles.joinButton}>Join</span>
      </div>
    </div>
  );

  if (watcher.roomId) {
    return (
      <Link to={`/room/${watcher.roomId}`} style={styles.watcherLink}>
        {content}
      </Link>
    );
  }

  return content;
};

const styles: Record<string, CSSProperties> = {
  container: {
    backgroundColor: "#1a1a1a",
    borderRadius: "12px",
    padding: "16px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  headerIcon: {
    fontSize: "18px",
  },
  title: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#fff",
  },
  onlineCount: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    color: "#22c55e",
  },
  onlineDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "#22c55e",
    animation: "pulse 2s infinite",
  },
  empty: {
    textAlign: "center",
    padding: "24px",
  },
  emptyText: {
    color: "#666",
    fontSize: "14px",
  },
  watcherList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  watcherLink: {
    textDecoration: "none",
    color: "inherit",
  },
  watcherCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px",
    backgroundColor: "#262626",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  watcherAvatar: {
    position: "relative",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  watcherAvatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    objectFit: "cover",
  },
  watcherAvatarText: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#fff",
  },
  watcherOnlineDot: {
    position: "absolute",
    bottom: "0",
    right: "0",
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    backgroundColor: "#22c55e",
    border: "2px solid #262626",
  },
  watcherInfo: {
    flex: 1,
    minWidth: 0,
  },
  watcherName: {
    display: "block",
    fontSize: "14px",
    fontWeight: "600",
    color: "#fff",
  },
  watcherRoom: {
    display: "block",
    fontSize: "12px",
    color: "#888",
    marginTop: "2px",
  },
  watcherVideo: {
    display: "block",
    fontSize: "11px",
    color: "#666",
    marginTop: "2px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  watcherAction: {},
  joinButton: {
    padding: "6px 12px",
    backgroundColor: "#8B5CF6",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#fff",
  },
  moreCard: {
    textAlign: "center",
    padding: "12px",
    backgroundColor: "#262626",
    borderRadius: "10px",
  },
  moreText: {
    fontSize: "13px",
    color: "#888",
  },
  // Compact styles
  compactContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 12px",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderRadius: "20px",
  },
  compactIndicator: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "#22c55e",
    animation: "pulse 2s infinite",
  },
  compactAvatars: {
    display: "flex",
    alignItems: "center",
  },
  compactAvatar: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid #1a1a1a",
  },
  compactAvatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    objectFit: "cover",
  },
  compactAvatarText: {
    fontSize: "10px",
    fontWeight: "600",
    color: "#fff",
  },
  compactAvatarMore: {
    backgroundColor: "#333",
    fontSize: "9px",
    fontWeight: "600",
    color: "#fff",
    marginLeft: "-8px",
  },
  compactText: {
    fontSize: "12px",
    color: "#22c55e",
  },
};

// Add pulse animation
if (typeof document !== "undefined") {
  const existingStyle = document.querySelector("style[data-friends-online]");
  if (!existingStyle) {
    const styleSheet = document.createElement("style");
    styleSheet.setAttribute("data-friends-online", "true");
    styleSheet.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `;
    document.head.appendChild(styleSheet);
  }
}
