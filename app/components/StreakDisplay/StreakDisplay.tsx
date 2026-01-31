import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Link } from "react-router";

interface StreakDisplayProps {
  compact?: boolean;
}

export const StreakDisplay = ({ compact = false }: StreakDisplayProps) => {
  const streak = useQuery(api.streaks.getMyStreak);

  if (!streak) {
    return null;
  }

  if (compact) {
    return (
      <Link to="/leaderboards" style={styles.compactContainer}>
        <span style={styles.fireIcon}>🔥</span>
        <span style={styles.compactStreak}>{streak.currentStreak}</span>
        {!streak.isActiveToday && streak.currentStreak > 0 && (
          <span style={styles.warningDot} title="Watch today to keep your streak!" />
        )}
      </Link>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.fireIcon}>🔥</span>
        <span style={styles.title}>Watch Streak</span>
      </div>

      <div style={styles.stats}>
        <div style={styles.statItem}>
          <span style={styles.statValue}>{streak.currentStreak}</span>
          <span style={styles.statLabel}>Current</span>
        </div>
        <div style={styles.divider} />
        <div style={styles.statItem}>
          <span style={styles.statValue}>{streak.longestStreak}</span>
          <span style={styles.statLabel}>Best</span>
        </div>
        <div style={styles.divider} />
        <div style={styles.statItem}>
          <span style={styles.statValue}>{streak.totalDaysWatched}</span>
          <span style={styles.statLabel}>Total</span>
        </div>
      </div>

      {!streak.isActiveToday && streak.currentStreak > 0 && (
        <div style={styles.warning}>
          Watch today to keep your streak!
        </div>
      )}

      {streak.isActiveToday && (
        <div style={styles.success}>
          ✓ You've watched today!
        </div>
      )}

      <Link to="/leaderboards" style={styles.leaderboardLink}>
        View Leaderboards →
      </Link>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: "#1a1a1a",
    borderRadius: "12px",
    padding: "16px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "16px",
  },
  fireIcon: {
    fontSize: "20px",
  },
  title: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#fff",
  },
  stats: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#262626",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "12px",
  },
  statItem: {
    textAlign: "center",
  },
  statValue: {
    display: "block",
    fontSize: "24px",
    fontWeight: "bold",
    color: "#fff",
  },
  statLabel: {
    display: "block",
    fontSize: "11px",
    color: "#888",
    textTransform: "uppercase",
    marginTop: "4px",
  },
  divider: {
    width: "1px",
    height: "40px",
    backgroundColor: "#333",
  },
  warning: {
    textAlign: "center",
    padding: "8px",
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    color: "#F59E0B",
    borderRadius: "6px",
    fontSize: "13px",
    marginBottom: "12px",
  },
  success: {
    textAlign: "center",
    padding: "8px",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    color: "#22c55e",
    borderRadius: "6px",
    fontSize: "13px",
    marginBottom: "12px",
  },
  leaderboardLink: {
    display: "block",
    textAlign: "center",
    color: "#8B5CF6",
    textDecoration: "none",
    fontSize: "13px",
  },
  // Compact styles
  compactContainer: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "6px 12px",
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderRadius: "20px",
    textDecoration: "none",
    color: "#fff",
    position: "relative",
  },
  compactStreak: {
    fontSize: "14px",
    fontWeight: "600",
  },
  warningDot: {
    position: "absolute",
    top: "-2px",
    right: "-2px",
    width: "8px",
    height: "8px",
    backgroundColor: "#F59E0B",
    borderRadius: "50%",
  },
};
