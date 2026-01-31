import { useEffect, type CSSProperties } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";

interface DailyChallengesProps {
  compact?: boolean;
}

export const DailyChallenges = ({ compact = false }: DailyChallengesProps) => {
  const challengesData = useQuery(api.challenges.getTodaysChallenges);
  const generateChallenges = useMutation(api.challenges.generateDailyChallenges);

  // Auto-generate challenges if needed
  useEffect(() => {
    if (challengesData?.needsGeneration) {
      generateChallenges();
    }
  }, [challengesData?.needsGeneration, generateChallenges]);

  if (!challengesData || challengesData.challenges.length === 0) {
    return null;
  }

  const { challenges } = challengesData;
  const completedCount = challenges.filter((c) => c.completed).length;
  const totalXpAvailable = challenges.reduce((sum, c) => sum + c.xpReward, 0);
  const earnedXp = challenges
    .filter((c) => c.completed)
    .reduce((sum, c) => sum + c.xpReward, 0);

  if (compact) {
    return (
      <div style={styles.compactContainer}>
        <div style={styles.compactHeader}>
          <span style={styles.compactIcon}>🎯</span>
          <span style={styles.compactText}>
            {completedCount}/{challenges.length}
          </span>
        </div>
        <div style={styles.compactProgress}>
          <div
            style={{
              ...styles.compactProgressFill,
              width: `${(completedCount / challenges.length) * 100}%`,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerIcon}>🎯</span>
          <span style={styles.title}>Daily Challenges</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.xpBadge}>+{totalXpAvailable} XP</span>
        </div>
      </div>

      <div style={styles.progressSummary}>
        <div style={styles.progressBar}>
          <div
            style={{
              ...styles.progressFill,
              width: `${(completedCount / challenges.length) * 100}%`,
            }}
          />
        </div>
        <span style={styles.progressText}>
          {completedCount}/{challenges.length} completed | {earnedXp}/{totalXpAvailable} XP
        </span>
      </div>

      <div style={styles.challengeList}>
        {challenges.map((challenge) => (
          <ChallengeCard key={challenge.id} challenge={challenge} />
        ))}
      </div>

      {completedCount === challenges.length && (
        <div style={styles.allComplete}>
          <span style={styles.allCompleteIcon}>🎉</span>
          <span>All challenges completed! Come back tomorrow for more.</span>
        </div>
      )}
    </div>
  );
};

interface ChallengeCardProps {
  challenge: {
    id: string;
    title: string;
    description: string;
    icon: string;
    target: number;
    xpReward: number;
    difficulty: string;
    progress: number;
    completed: boolean;
  };
}

const ChallengeCard = ({ challenge }: ChallengeCardProps) => {
  const progressPercent = Math.min(100, (challenge.progress / challenge.target) * 100);

  const difficultyColor = {
    easy: "#22c55e",
    medium: "#f59e0b",
    hard: "#ef4444",
  }[challenge.difficulty] || "#8B5CF6";

  return (
    <div
      style={{
        ...styles.challengeCard,
        ...(challenge.completed ? styles.challengeCardCompleted : {}),
      }}
    >
      <div style={styles.challengeIcon}>
        <span>{challenge.icon}</span>
      </div>

      <div style={styles.challengeContent}>
        <div style={styles.challengeHeader}>
          <span style={styles.challengeTitle}>{challenge.title}</span>
          <span style={{ ...styles.difficultyBadge, background: difficultyColor }}>
            {challenge.difficulty}
          </span>
        </div>
        <span style={styles.challengeDescription}>{challenge.description}</span>

        <div style={styles.challengeProgress}>
          <div style={styles.challengeProgressBar}>
            <div
              style={{
                ...styles.challengeProgressFill,
                width: `${progressPercent}%`,
                background: challenge.completed ? "#22c55e" : "#8B5CF6",
              }}
            />
          </div>
          <span style={styles.challengeProgressText}>
            {challenge.progress}/{challenge.target}
          </span>
        </div>
      </div>

      <div style={styles.challengeReward}>
        {challenge.completed ? (
          <span style={styles.checkmark}>✓</span>
        ) : (
          <span style={styles.xpReward}>+{challenge.xpReward}</span>
        )}
      </div>
    </div>
  );
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
    fontSize: "20px",
  },
  title: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#fff",
  },
  headerRight: {},
  xpBadge: {
    padding: "4px 10px",
    background: "linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#fff",
  },
  progressSummary: {
    marginBottom: "16px",
  },
  progressBar: {
    height: "8px",
    backgroundColor: "#262626",
    borderRadius: "4px",
    overflow: "hidden",
    marginBottom: "8px",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #8B5CF6 0%, #6366F1 100%)",
    borderRadius: "4px",
    transition: "width 0.3s ease",
  },
  progressText: {
    fontSize: "12px",
    color: "#888",
  },
  challengeList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  challengeCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    backgroundColor: "#262626",
    borderRadius: "10px",
    transition: "all 0.2s ease",
  },
  challengeCardCompleted: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    border: "1px solid rgba(34, 197, 94, 0.3)",
  },
  challengeIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    backgroundColor: "#1a1a1a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    flexShrink: 0,
  },
  challengeContent: {
    flex: 1,
    minWidth: 0,
  },
  challengeHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "4px",
  },
  challengeTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#fff",
  },
  difficultyBadge: {
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "10px",
    fontWeight: "600",
    color: "#fff",
    textTransform: "uppercase",
  },
  challengeDescription: {
    display: "block",
    fontSize: "12px",
    color: "#888",
    marginBottom: "8px",
  },
  challengeProgress: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  challengeProgressBar: {
    flex: 1,
    height: "4px",
    backgroundColor: "#1a1a1a",
    borderRadius: "2px",
    overflow: "hidden",
  },
  challengeProgressFill: {
    height: "100%",
    borderRadius: "2px",
    transition: "width 0.3s ease",
  },
  challengeProgressText: {
    fontSize: "11px",
    color: "#666",
    minWidth: "40px",
    textAlign: "right",
  },
  challengeReward: {
    flexShrink: 0,
  },
  xpReward: {
    padding: "4px 8px",
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#8B5CF6",
  },
  checkmark: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    backgroundColor: "#22c55e",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "bold",
  },
  allComplete: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "16px",
    marginTop: "16px",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderRadius: "8px",
    color: "#22c55e",
    fontSize: "14px",
  },
  allCompleteIcon: {
    fontSize: "20px",
  },
  // Compact styles
  compactContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 12px",
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    borderRadius: "20px",
  },
  compactHeader: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  compactIcon: {
    fontSize: "14px",
  },
  compactText: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#fff",
  },
  compactProgress: {
    width: "40px",
    height: "4px",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: "2px",
    overflow: "hidden",
  },
  compactProgressFill: {
    height: "100%",
    backgroundColor: "#8B5CF6",
    borderRadius: "2px",
    transition: "width 0.3s ease",
  },
};
