import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";

type Category = "watchTime" | "partiesHosted" | "messagesSent" | "reactionsGiven";
type Period = "weekly" | "monthly" | "alltime";

export default function LeaderboardsPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category>("watchTime");
  const [period, setPeriod] = useState<Period>("alltime");

  const leaderboard = useQuery(api.leaderboards.getLeaderboard, {
    period,
    category,
    limit: 20,
  });

  const myRanking = useQuery(api.leaderboards.getMyRanking, { category });
  const allTimeStats = useQuery(api.leaderboards.getAllTimeStats);
  const streakLeaderboard = useQuery(api.streaks.getStreakLeaderboard, { limit: 10 });

  const formatScore = (score: number, cat: Category): string => {
    if (cat === "watchTime") {
      if (score < 60) return `${score}m`;
      const hours = Math.floor(score / 60);
      if (hours < 24) return `${hours}h`;
      const days = Math.floor(hours / 24);
      return `${days}d`;
    }
    return score.toLocaleString();
  };

  const getCategoryLabel = (cat: Category): string => {
    switch (cat) {
      case "watchTime":
        return "Watch Time";
      case "partiesHosted":
        return "Parties Hosted";
      case "messagesSent":
        return "Messages Sent";
      case "reactionsGiven":
        return "Reactions Given";
    }
  };

  const getCategoryIcon = (cat: Category): string => {
    switch (cat) {
      case "watchTime":
        return "⏱️";
      case "partiesHosted":
        return "🎉";
      case "messagesSent":
        return "💬";
      case "reactionsGiven":
        return "😄";
    }
  };

  const getRankMedal = (rank: number): string => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return `#${rank}`;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <button onClick={() => navigate(-1)} style={styles.backButton}>
            ← Back
          </button>
          <h1 style={styles.title}>Leaderboards</h1>
        </div>

        {/* Global Stats */}
        {allTimeStats && (
          <div style={styles.globalStats}>
            <div style={styles.globalStatItem}>
              <span style={styles.globalStatValue}>{allTimeStats.totalUsers}</span>
              <span style={styles.globalStatLabel}>Users</span>
            </div>
            <div style={styles.globalStatItem}>
              <span style={styles.globalStatValue}>{allTimeStats.totalWatchTimeHours}h</span>
              <span style={styles.globalStatLabel}>Watch Time</span>
            </div>
            <div style={styles.globalStatItem}>
              <span style={styles.globalStatValue}>{allTimeStats.totalVideosWatched}</span>
              <span style={styles.globalStatLabel}>Videos</span>
            </div>
            <div style={styles.globalStatItem}>
              <span style={styles.globalStatValue}>{allTimeStats.totalMessages}</span>
              <span style={styles.globalStatLabel}>Messages</span>
            </div>
          </div>
        )}

        {/* My Ranking */}
        {myRanking && (
          <div style={styles.myRankingCard}>
            <h3 style={styles.myRankingTitle}>Your Ranking</h3>
            <div style={styles.myRankingContent}>
              <div style={styles.myRankingItem}>
                <span style={styles.myRankingLabel}>Rank</span>
                <span style={styles.myRankingValue}>#{myRanking.rank}</span>
              </div>
              <div style={styles.myRankingItem}>
                <span style={styles.myRankingLabel}>Top</span>
                <span style={styles.myRankingValue}>{myRanking.percentile}%</span>
              </div>
              <div style={styles.myRankingItem}>
                <span style={styles.myRankingLabel}>Score</span>
                <span style={styles.myRankingValue}>
                  {formatScore(myRanking.score, category)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Category Tabs */}
        <div style={styles.tabs}>
          {(["watchTime", "partiesHosted", "messagesSent", "reactionsGiven"] as Category[]).map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  ...styles.tab,
                  ...(category === cat ? styles.tabActive : {}),
                }}
              >
                {getCategoryIcon(cat)} {getCategoryLabel(cat)}
              </button>
            )
          )}
        </div>

        {/* Period Tabs */}
        <div style={styles.periodTabs}>
          {(["weekly", "monthly", "alltime"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                ...styles.periodTab,
                ...(period === p ? styles.periodTabActive : {}),
              }}
            >
              {p === "alltime" ? "All Time" : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Leaderboard List */}
        <div style={styles.leaderboardSection}>
          <h2 style={styles.sectionTitle}>
            {getCategoryIcon(category)} {getCategoryLabel(category)} Leaderboard
          </h2>

          {leaderboard && leaderboard.length > 0 ? (
            <div style={styles.leaderboardList}>
              {leaderboard.map((entry, index) => (
                <Link
                  key={entry.user._id}
                  to={`/profile/${entry.user.username}`}
                  style={{
                    ...styles.leaderboardItem,
                    ...(index < 3 ? styles.topThree : {}),
                  }}
                >
                  <div style={styles.rank}>
                    {index < 3 ? (
                      <span style={styles.medal}>{getRankMedal(entry.rank)}</span>
                    ) : (
                      <span style={styles.rankNumber}>#{entry.rank}</span>
                    )}
                  </div>
                  <div
                    style={{
                      ...styles.userAvatar,
                      backgroundColor: entry.user.avatarColor,
                    }}
                  >
                    {entry.user.avatar ? (
                      <img
                        src={entry.user.avatar}
                        alt={entry.user.username}
                        style={styles.avatarImage}
                      />
                    ) : (
                      entry.user.username.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div style={styles.userInfo}>
                    <span style={styles.username}>{entry.user.username}</span>
                  </div>
                  <div style={styles.score}>
                    {formatScore(entry.score, category)}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p style={styles.emptyText}>No data available</p>
          )}
        </div>

        {/* Streak Leaderboard */}
        <div style={styles.leaderboardSection}>
          <h2 style={styles.sectionTitle}>🔥 Watch Streak Leaders</h2>

          {streakLeaderboard && streakLeaderboard.length > 0 ? (
            <div style={styles.leaderboardList}>
              {streakLeaderboard.map((entry, index) => (
                <Link
                  key={entry.user?._id}
                  to={entry.user ? `/profile/${entry.user.username}` : "#"}
                  style={{
                    ...styles.leaderboardItem,
                    ...(index < 3 ? styles.topThree : {}),
                  }}
                >
                  <div style={styles.rank}>
                    {index < 3 ? (
                      <span style={styles.medal}>{getRankMedal(entry.rank)}</span>
                    ) : (
                      <span style={styles.rankNumber}>#{entry.rank}</span>
                    )}
                  </div>
                  <div
                    style={{
                      ...styles.userAvatar,
                      backgroundColor: entry.user?.avatarColor || "#8B5CF6",
                    }}
                  >
                    {entry.user?.avatar ? (
                      <img
                        src={entry.user.avatar}
                        alt={entry.user.username}
                        style={styles.avatarImage}
                      />
                    ) : (
                      entry.user?.username.charAt(0).toUpperCase() || "?"
                    )}
                  </div>
                  <div style={styles.userInfo}>
                    <span style={styles.username}>
                      {entry.user?.username || "Unknown"}
                    </span>
                  </div>
                  <div style={styles.score}>
                    {entry.currentStreak} days
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p style={styles.emptyText}>No active streaks</p>
          )}
        </div>
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
  header: {
    marginBottom: "24px",
  },
  backButton: {
    background: "none",
    border: "none",
    color: "#8B5CF6",
    fontSize: "16px",
    cursor: "pointer",
    marginBottom: "16px",
    padding: "8px 0",
  },
  title: {
    margin: 0,
    fontSize: "32px",
    fontWeight: "bold",
  },
  globalStats: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    padding: "20px",
    backgroundColor: "#1a1a1a",
    borderRadius: "16px",
    marginBottom: "24px",
  },
  globalStatItem: {
    textAlign: "center",
  },
  globalStatValue: {
    display: "block",
    fontSize: "24px",
    fontWeight: "bold",
    color: "#8B5CF6",
  },
  globalStatLabel: {
    display: "block",
    fontSize: "12px",
    color: "#888",
    textTransform: "uppercase",
    marginTop: "4px",
  },
  myRankingCard: {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    border: "1px solid rgba(139, 92, 246, 0.3)",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "24px",
  },
  myRankingTitle: {
    margin: "0 0 16px 0",
    fontSize: "16px",
    color: "#8B5CF6",
  },
  myRankingContent: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
  },
  myRankingItem: {
    textAlign: "center",
  },
  myRankingLabel: {
    display: "block",
    fontSize: "12px",
    color: "#888",
    marginBottom: "4px",
  },
  myRankingValue: {
    display: "block",
    fontSize: "24px",
    fontWeight: "bold",
  },
  tabs: {
    display: "flex",
    gap: "8px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  tab: {
    padding: "10px 16px",
    backgroundColor: "#1a1a1a",
    border: "none",
    borderRadius: "8px",
    color: "#888",
    cursor: "pointer",
    fontSize: "14px",
    transition: "all 0.2s",
  },
  tabActive: {
    backgroundColor: "#8B5CF6",
    color: "#fff",
  },
  periodTabs: {
    display: "flex",
    gap: "8px",
    marginBottom: "24px",
  },
  periodTab: {
    padding: "8px 16px",
    backgroundColor: "transparent",
    border: "1px solid #333",
    borderRadius: "20px",
    color: "#888",
    cursor: "pointer",
    fontSize: "13px",
    transition: "all 0.2s",
  },
  periodTabActive: {
    borderColor: "#8B5CF6",
    color: "#8B5CF6",
  },
  leaderboardSection: {
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
  leaderboardList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  leaderboardItem: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "12px 16px",
    backgroundColor: "#252525",
    borderRadius: "12px",
    textDecoration: "none",
    color: "#fff",
    transition: "background-color 0.2s",
  },
  topThree: {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    border: "1px solid rgba(139, 92, 246, 0.2)",
  },
  rank: {
    width: "40px",
    textAlign: "center",
  },
  medal: {
    fontSize: "24px",
  },
  rankNumber: {
    fontSize: "14px",
    color: "#888",
  },
  userAvatar: {
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
    fontSize: "15px",
    fontWeight: "500",
  },
  score: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#8B5CF6",
  },
  emptyText: {
    color: "#666",
    margin: 0,
    fontSize: "14px",
    textAlign: "center",
    padding: "20px",
  },
};
