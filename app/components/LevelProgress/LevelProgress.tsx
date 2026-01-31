import { type CSSProperties } from "react";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";

interface LevelProgressProps {
  compact?: boolean;
  showHistory?: boolean;
}

export const LevelProgress = ({ compact = false, showHistory = false }: LevelProgressProps) => {
  const levelData = useQuery(api.levels.getMyLevel);
  const xpHistory = useQuery(
    api.levels.getXpHistory,
    showHistory ? { limit: 5 } : "skip"
  );

  if (!levelData) {
    return null;
  }

  if (compact) {
    return (
      <div style={styles.compactContainer}>
        <div style={styles.compactLevel}>
          <span style={styles.compactLevelNumber}>{levelData.level}</span>
        </div>
        <div style={styles.compactInfo}>
          <span style={styles.compactTitle}>{levelData.title}</span>
          <div style={styles.compactProgressBar}>
            <div
              style={{
                ...styles.compactProgressFill,
                width: `${levelData.progressPercent}%`,
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.levelBadge}>
          <span style={styles.levelNumber}>{levelData.level}</span>
        </div>
        <div style={styles.headerInfo}>
          <span style={styles.title}>{levelData.title}</span>
          <span style={styles.xpText}>
            {levelData.totalXp.toLocaleString()} Total XP
          </span>
        </div>
      </div>

      <div style={styles.progressSection}>
        <div style={styles.progressLabels}>
          <span style={styles.progressLabel}>Level {levelData.level}</span>
          <span style={styles.progressLabel}>Level {levelData.level + 1}</span>
        </div>
        <div style={styles.progressBar}>
          <div
            style={{
              ...styles.progressFill,
              width: `${levelData.progressPercent}%`,
            }}
          />
          <div style={styles.progressGlow} />
        </div>
        <div style={styles.progressStats}>
          <span style={styles.progressStat}>
            {levelData.xpInCurrentLevel?.toLocaleString() || 0} / {levelData.xpNeededForNextLevel?.toLocaleString() || 0} XP
          </span>
          <span style={styles.progressPercent}>{levelData.progressPercent}%</span>
        </div>
      </div>

      {levelData.lastXpGain && (
        <div style={styles.lastGain}>
          <span style={styles.lastGainIcon}>+{levelData.lastXpGain.amount}</span>
          <span style={styles.lastGainReason}>{levelData.lastXpGain.reason}</span>
        </div>
      )}

      {showHistory && xpHistory && xpHistory.length > 0 && (
        <div style={styles.historySection}>
          <span style={styles.historyTitle}>Recent XP</span>
          <div style={styles.historyList}>
            {xpHistory.map((tx, index) => (
              <div key={index} style={styles.historyItem}>
                <span style={styles.historyAmount}>+{tx.amount}</span>
                <span style={styles.historyReason}>{tx.reason}</span>
                <span style={styles.historyTime}>
                  {formatTimeAgo(tx.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={styles.tiers}>
        <TierPreview currentLevel={levelData.level} />
      </div>
    </div>
  );
};

interface TierPreviewProps {
  currentLevel: number;
}

const TierPreview = ({ currentLevel }: TierPreviewProps) => {
  const tiers = [
    { minLevel: 1, maxLevel: 5, title: "Newbie", color: "#6b7280" },
    { minLevel: 6, maxLevel: 10, title: "Regular", color: "#22c55e" },
    { minLevel: 11, maxLevel: 15, title: "Enthusiast", color: "#3b82f6" },
    { minLevel: 16, maxLevel: 20, title: "Dedicated", color: "#8B5CF6" },
    { minLevel: 21, maxLevel: 25, title: "Veteran", color: "#f59e0b" },
    { minLevel: 26, maxLevel: 30, title: "Expert", color: "#ef4444" },
    { minLevel: 31, maxLevel: 50, title: "Master", color: "#ec4899" },
    { minLevel: 51, maxLevel: 100, title: "Legend", color: "#ffd700" },
  ];

  const currentTierIndex = tiers.findIndex(
    (t) => currentLevel >= t.minLevel && currentLevel <= t.maxLevel
  );

  return (
    <div style={styles.tierList}>
      {tiers.slice(0, 6).map((tier, index) => {
        const isActive = index === currentTierIndex;
        const isPast = index < currentTierIndex;
        const isFuture = index > currentTierIndex;

        return (
          <div
            key={tier.title}
            style={{
              ...styles.tierItem,
              ...(isActive ? styles.tierItemActive : {}),
              ...(isPast ? styles.tierItemPast : {}),
              ...(isFuture ? styles.tierItemFuture : {}),
            }}
          >
            <div
              style={{
                ...styles.tierDot,
                backgroundColor: isPast || isActive ? tier.color : "#333",
              }}
            />
            <span
              style={{
                ...styles.tierLabel,
                color: isActive ? tier.color : isPast ? "#888" : "#444",
              }}
            >
              {tier.title}
            </span>
          </div>
        );
      })}
    </div>
  );
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.round(diff / 3600000)}h ago`;

  return `${Math.round(diff / 86400000)}d ago`;
}

const styles: Record<string, CSSProperties> = {
  container: {
    backgroundColor: "#1a1a1a",
    borderRadius: "12px",
    padding: "16px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
  },
  levelBadge: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
  },
  levelNumber: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#fff",
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    display: "block",
    fontSize: "18px",
    fontWeight: "600",
    color: "#fff",
    marginBottom: "2px",
  },
  xpText: {
    fontSize: "13px",
    color: "#888",
  },
  progressSection: {
    marginBottom: "16px",
  },
  progressLabels: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "6px",
  },
  progressLabel: {
    fontSize: "11px",
    color: "#666",
  },
  progressBar: {
    position: "relative",
    height: "12px",
    backgroundColor: "#262626",
    borderRadius: "6px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #8B5CF6 0%, #6366F1 50%, #8B5CF6 100%)",
    backgroundSize: "200% 100%",
    borderRadius: "6px",
    transition: "width 0.5s ease",
    animation: "shimmer 2s linear infinite",
  },
  progressGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)",
    animation: "glow 2s ease-in-out infinite",
  },
  progressStats: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "6px",
  },
  progressStat: {
    fontSize: "12px",
    color: "#888",
  },
  progressPercent: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#8B5CF6",
  },
  lastGain: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    borderRadius: "8px",
    marginBottom: "16px",
  },
  lastGainIcon: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#8B5CF6",
  },
  lastGainReason: {
    fontSize: "13px",
    color: "#a3a3a3",
  },
  historySection: {
    marginTop: "16px",
    paddingTop: "16px",
    borderTop: "1px solid #262626",
  },
  historyTitle: {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    color: "#888",
    marginBottom: "12px",
  },
  historyList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  historyItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
  },
  historyAmount: {
    color: "#22c55e",
    fontWeight: "600",
    minWidth: "40px",
  },
  historyReason: {
    flex: 1,
    color: "#a3a3a3",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  historyTime: {
    color: "#666",
  },
  tiers: {
    marginTop: "16px",
    paddingTop: "16px",
    borderTop: "1px solid #262626",
  },
  tierList: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tierItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  },
  tierItemActive: {},
  tierItemPast: {},
  tierItemFuture: {
    opacity: 0.5,
  },
  tierDot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    border: "2px solid #262626",
  },
  tierLabel: {
    fontSize: "9px",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  // Compact styles
  compactContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "4px 8px 4px 4px",
    backgroundColor: "#262626",
    borderRadius: "20px",
  },
  compactLevel: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  compactLevelNumber: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#fff",
  },
  compactInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  compactTitle: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#fff",
  },
  compactProgressBar: {
    width: "50px",
    height: "3px",
    backgroundColor: "#1a1a1a",
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

// Add shimmer animation
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    @keyframes glow {
      0%, 100% { transform: translateX(-100%); }
      50% { transform: translateX(100%); }
    }
  `;
  document.head.appendChild(styleSheet);
}
