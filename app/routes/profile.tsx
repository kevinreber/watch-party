import { useParams, useNavigate, Link } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useUser } from "@clerk/clerk-react";

export default function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { isSignedIn } = useUser();

  // First, get the user by username
  const userByUsername = useQuery(api.users.getUserByUsername, {
    username: username || "",
  });

  // Then get the full profile
  const profile = useQuery(
    api.users.getUserProfile,
    userByUsername?._id ? { userId: userByUsername._id as Id<"users"> } : "skip"
  );

  const sendFriendRequest = useMutation(api.friends.sendFriendRequest);

  const handleSendFriendRequest = async () => {
    if (!profile?.user._id) return;
    try {
      await sendFriendRequest({ toUserId: profile.user._id as Id<"users"> });
    } catch (error) {
      console.error("Failed to send friend request:", error);
    }
  };

  if (!userByUsername) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.notFound}>
            <h1>User not found</h1>
            <p>The user "{username}" doesn't exist.</p>
            <Link to="/" style={styles.backLink}>
              Go back home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.loading}>Loading profile...</div>
        </div>
      </div>
    );
  }

  const formatWatchTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours < 24) return `${hours}h ${mins}m`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  };

  const getActivityDescription = (activity: typeof profile.recentActivity[0]) => {
    switch (activity.type) {
      case "watching":
        return `Watching ${activity.videoName || "a video"} in ${activity.roomName || "a room"}`;
      case "joined_room":
        return `Joined ${activity.roomName || "a room"}`;
      case "created_room":
        return `Created ${activity.roomName || "a room"}`;
      case "started_party":
        return `Started a watch party`;
      case "added_friend":
        return `Made a new friend`;
      case "earned_badge":
        return `Earned the "${activity.badgeName}" badge`;
      case "created_playlist":
        return `Created a new playlist`;
      case "joined_group":
        return `Joined a group`;
      default:
        return "Activity";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Back Button */}
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          ← Back
        </button>

        {/* Profile Header */}
        <div style={styles.profileHeader}>
          <div
            style={{
              ...styles.avatar,
              backgroundColor: profile.user.avatarColor,
            }}
          >
            {profile.user.avatar ? (
              <img
                src={profile.user.avatar}
                alt={profile.user.username}
                style={styles.avatarImage}
              />
            ) : (
              profile.user.username.charAt(0).toUpperCase()
            )}
          </div>
          <div style={styles.userInfo}>
            <h1 style={styles.username}>{profile.user.username}</h1>
            <p style={styles.memberSince}>
              Member since {new Date(profile.user.createdAt).toLocaleDateString()}
            </p>
            {profile.streak && profile.streak.currentStreak > 0 && (
              <div style={styles.streakBadge}>
                🔥 {profile.streak.currentStreak} day streak
              </div>
            )}
          </div>
          {isSignedIn && !profile.isFriend && profile.friendRequestStatus !== "sent" && (
            <button
              onClick={handleSendFriendRequest}
              style={styles.friendButton}
            >
              Add Friend
            </button>
          )}
          {profile.friendRequestStatus === "sent" && (
            <span style={styles.requestSent}>Request Sent</span>
          )}
          {profile.isFriend && (
            <span style={styles.friendBadge}>✓ Friends</span>
          )}
        </div>

        {/* Stats Grid */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{formatWatchTime(profile.stats.totalWatchTime)}</div>
            <div style={styles.statLabel}>Watch Time</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{profile.stats.videosWatched}</div>
            <div style={styles.statLabel}>Videos Watched</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{profile.stats.partiesHosted}</div>
            <div style={styles.statLabel}>Parties Hosted</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{profile.friendsCount}</div>
            <div style={styles.statLabel}>Friends</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{profile.stats.messagesSent}</div>
            <div style={styles.statLabel}>Messages</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{profile.groupsCount}</div>
            <div style={styles.statLabel}>Groups</div>
          </div>
        </div>

        {/* Badges Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            Badges ({profile.badges.length})
          </h2>
          {profile.badges.length > 0 ? (
            <div style={styles.badgesGrid}>
              {profile.badges.map((badge) => (
                <div key={badge._id} style={styles.badge} title={badge.description}>
                  <span style={styles.badgeIcon}>{badge.icon}</span>
                  <span style={styles.badgeName}>{badge.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={styles.emptyText}>No badges earned yet</p>
          )}
        </div>

        {/* Recent Activity Section */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Recent Activity</h2>
          {profile.recentActivity.length > 0 ? (
            <div style={styles.activityList}>
              {profile.recentActivity.map((activity, index) => (
                <div key={index} style={styles.activityItem}>
                  <span style={styles.activityText}>
                    {getActivityDescription(activity)}
                  </span>
                  <span style={styles.activityTime}>
                    {formatDate(activity.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={styles.emptyText}>No recent activity</p>
          )}
        </div>

        {/* Streak Info */}
        {profile.streak && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Watch Streak</h2>
            <div style={styles.streakGrid}>
              <div style={styles.streakItem}>
                <div style={styles.streakValue}>🔥 {profile.streak.currentStreak}</div>
                <div style={styles.streakLabel}>Current Streak</div>
              </div>
              <div style={styles.streakItem}>
                <div style={styles.streakValue}>🏆 {profile.streak.longestStreak}</div>
                <div style={styles.streakLabel}>Longest Streak</div>
              </div>
              <div style={styles.streakItem}>
                <div style={styles.streakValue}>📅 {profile.streak.totalDaysWatched}</div>
                <div style={styles.streakLabel}>Total Days</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#0f0f0f",
    color: "#fff",
    padding: "20px",
  },
  content: {
    maxWidth: "800px",
    margin: "0 auto",
  },
  backButton: {
    background: "none",
    border: "none",
    color: "#8B5CF6",
    fontSize: "16px",
    cursor: "pointer",
    marginBottom: "20px",
    padding: "8px 0",
  },
  loading: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#888",
  },
  notFound: {
    textAlign: "center",
    padding: "60px 20px",
  },
  backLink: {
    color: "#8B5CF6",
    textDecoration: "none",
    marginTop: "20px",
    display: "inline-block",
  },
  profileHeader: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    padding: "24px",
    backgroundColor: "#1a1a1a",
    borderRadius: "16px",
    marginBottom: "24px",
  },
  avatar: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "32px",
    fontWeight: "bold",
    color: "#fff",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  userInfo: {
    flex: 1,
  },
  username: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "bold",
  },
  memberSince: {
    margin: "4px 0 0 0",
    color: "#888",
    fontSize: "14px",
  },
  streakBadge: {
    display: "inline-block",
    marginTop: "8px",
    padding: "4px 12px",
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    color: "#EF4444",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "500",
  },
  friendButton: {
    padding: "10px 20px",
    backgroundColor: "#8B5CF6",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
  },
  requestSent: {
    padding: "10px 20px",
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    color: "#8B5CF6",
    borderRadius: "8px",
    fontSize: "14px",
  },
  friendBadge: {
    padding: "10px 20px",
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    color: "#10B981",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },
  statCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
  },
  statValue: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#8B5CF6",
  },
  statLabel: {
    fontSize: "12px",
    color: "#888",
    marginTop: "4px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  section: {
    backgroundColor: "#1a1a1a",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "24px",
  },
  sectionTitle: {
    margin: "0 0 16px 0",
    fontSize: "18px",
    fontWeight: "600",
  },
  badgesGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
  },
  badge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    backgroundColor: "#252525",
    borderRadius: "8px",
  },
  badgeIcon: {
    fontSize: "20px",
  },
  badgeName: {
    fontSize: "14px",
    fontWeight: "500",
  },
  emptyText: {
    color: "#666",
    margin: 0,
    fontSize: "14px",
  },
  activityList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  activityItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px",
    backgroundColor: "#252525",
    borderRadius: "8px",
  },
  activityText: {
    fontSize: "14px",
  },
  activityTime: {
    fontSize: "12px",
    color: "#888",
  },
  streakGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
  },
  streakItem: {
    textAlign: "center",
    padding: "16px",
    backgroundColor: "#252525",
    borderRadius: "12px",
  },
  streakValue: {
    fontSize: "24px",
    fontWeight: "bold",
  },
  streakLabel: {
    fontSize: "12px",
    color: "#888",
    marginTop: "4px",
  },
};
