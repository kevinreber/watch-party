import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { Link } from "react-router";

interface ActivityFeedProps {
  onClose: () => void;
}

export const ActivityFeed = ({ onClose }: ActivityFeedProps) => {
  const friendsActivity = useQuery(api.activity.getFriendsActivity, { limit: 30 });
  const activeWatchers = useQuery(api.activity.getActiveWatchers);

  const getActivityDescription = (activity: NonNullable<typeof friendsActivity>[0]) => {
    switch (activity.type) {
      case "watching":
        return (
          <>
            is watching <strong>{activity.videoName || "a video"}</strong>
            {activity.roomName && (
              <>
                {" "}in <strong>{activity.roomName}</strong>
              </>
            )}
          </>
        );
      case "joined_room":
        return (
          <>
            joined <strong>{activity.roomName || "a room"}</strong>
          </>
        );
      case "created_room":
        return (
          <>
            created <strong>{activity.roomName || "a room"}</strong>
          </>
        );
      case "started_party":
        return "started a watch party";
      case "added_friend":
        return "made a new friend";
      case "earned_badge":
        return (
          <>
            earned the <strong>{activity.badgeName}</strong> badge
          </>
        );
      case "created_playlist":
        return "created a new playlist";
      case "joined_group":
        return "joined a group";
      default:
        return "was active";
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Activity Feed</h2>
          <button onClick={onClose} style={styles.closeButton}>
            &times;
          </button>
        </div>

        {/* Active Watchers Section */}
        {activeWatchers && activeWatchers.length > 0 && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>
              <span style={styles.liveIndicator} /> Friends Watching Now
            </h3>
            <div style={styles.activeWatchersList}>
              {activeWatchers.map((watcher) => (
                <Link
                  key={watcher._id}
                  to={watcher.roomId ? `/room/${watcher.roomId}` : "#"}
                  style={styles.activeWatcher}
                >
                  <div
                    style={{
                      ...styles.avatar,
                      backgroundColor: watcher.user?.avatarColor || "#8B5CF6",
                    }}
                  >
                    {watcher.user?.avatar ? (
                      <img
                        src={watcher.user.avatar}
                        alt={watcher.user.username}
                        style={styles.avatarImage}
                      />
                    ) : (
                      watcher.user?.username?.charAt(0).toUpperCase() || "?"
                    )}
                  </div>
                  <div style={styles.watcherInfo}>
                    <span style={styles.watcherName}>{watcher.user?.username}</span>
                    <span style={styles.watcherVideo}>
                      {watcher.videoName || "Watching..."}
                    </span>
                  </div>
                  <span style={styles.joinButton}>Join</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity Section */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Recent Activity</h3>
          {friendsActivity && friendsActivity.length > 0 ? (
            <div style={styles.activityList}>
              {friendsActivity.map((activity) => (
                <div key={activity._id} style={styles.activityItem}>
                  <Link
                    to={activity.user ? `/profile/${activity.user.username}` : "#"}
                    style={styles.activityAvatarLink}
                  >
                    <div
                      style={{
                        ...styles.activityAvatar,
                        backgroundColor: activity.user?.avatarColor || "#8B5CF6",
                      }}
                    >
                      {activity.user?.avatar ? (
                        <img
                          src={activity.user.avatar}
                          alt={activity.user.username}
                          style={styles.avatarImage}
                        />
                      ) : (
                        activity.user?.username?.charAt(0).toUpperCase() || "?"
                      )}
                    </div>
                  </Link>
                  <div style={styles.activityContent}>
                    <div style={styles.activityText}>
                      <Link
                        to={activity.user ? `/profile/${activity.user.username}` : "#"}
                        style={styles.usernameLink}
                      >
                        {activity.user?.username}
                      </Link>{" "}
                      {getActivityDescription(activity)}
                    </div>
                    <span style={styles.activityTime}>
                      {formatTime(activity.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <p style={styles.emptyText}>No recent activity from friends</p>
              <p style={styles.emptySubtext}>
                Add friends to see what they're watching!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  panel: {
    backgroundColor: "#1a1a1a",
    borderRadius: "16px",
    width: "90%",
    maxWidth: "500px",
    maxHeight: "80vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px",
    borderBottom: "1px solid #333",
  },
  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "600",
    color: "#fff",
  },
  closeButton: {
    background: "none",
    border: "none",
    color: "#888",
    fontSize: "28px",
    cursor: "pointer",
    lineHeight: 1,
  },
  section: {
    padding: "16px 20px",
    borderBottom: "1px solid #333",
  },
  sectionTitle: {
    margin: "0 0 12px 0",
    fontSize: "14px",
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  liveIndicator: {
    width: "8px",
    height: "8px",
    backgroundColor: "#22c55e",
    borderRadius: "50%",
    animation: "pulse 2s infinite",
  },
  activeWatchersList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  activeWatcher: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderRadius: "12px",
    textDecoration: "none",
    color: "#fff",
    border: "1px solid rgba(34, 197, 94, 0.2)",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: "bold",
    color: "#fff",
    overflow: "hidden",
    flexShrink: 0,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  watcherInfo: {
    flex: 1,
    minWidth: 0,
  },
  watcherName: {
    display: "block",
    fontWeight: "500",
    fontSize: "14px",
  },
  watcherVideo: {
    display: "block",
    fontSize: "12px",
    color: "#888",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  joinButton: {
    padding: "6px 12px",
    backgroundColor: "#22c55e",
    color: "#fff",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "500",
  },
  activityList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    maxHeight: "400px",
    overflowY: "auto",
  },
  activityItem: {
    display: "flex",
    gap: "12px",
  },
  activityAvatarLink: {
    textDecoration: "none",
  },
  activityAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "bold",
    color: "#fff",
    overflow: "hidden",
    flexShrink: 0,
  },
  activityContent: {
    flex: 1,
    minWidth: 0,
  },
  activityText: {
    fontSize: "14px",
    color: "#fff",
    lineHeight: 1.4,
  },
  usernameLink: {
    color: "#8B5CF6",
    textDecoration: "none",
    fontWeight: "500",
  },
  activityTime: {
    fontSize: "12px",
    color: "#666",
    marginTop: "4px",
    display: "block",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px 20px",
  },
  emptyText: {
    margin: 0,
    color: "#888",
    fontSize: "14px",
  },
  emptySubtext: {
    margin: "8px 0 0 0",
    color: "#666",
    fontSize: "13px",
  },
};

// Inject animation
if (typeof document !== "undefined") {
  const styleEl = document.createElement("style");
  styleEl.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `;
  document.head.appendChild(styleEl);
}
