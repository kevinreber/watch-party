import { useState, useEffect, type CSSProperties } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";

interface BadgeNotificationProps {
  onClose?: () => void;
}

interface NewBadge {
  name: string;
  icon: string;
  description: string;
}

export const BadgeNotification = ({ onClose }: BadgeNotificationProps) => {
  const [newBadges, setNewBadges] = useState<NewBadge[]>([]);
  const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const checkBadges = useMutation(api.badges.checkAndAwardBadges);
  const badgeDefinitions = useQuery(api.badges.getAllBadgeDefinitions);

  // Check for new badges periodically
  useEffect(() => {
    const checkForBadges = async () => {
      try {
        const newBadgeNames = await checkBadges();
        if (newBadgeNames.length > 0 && badgeDefinitions) {
          const badges: NewBadge[] = [];
          const allBadges = Object.values(badgeDefinitions).flat();

          for (const name of newBadgeNames) {
            const badge = allBadges.find((b) => b.name === name);
            if (badge) {
              badges.push({
                name: badge.name,
                icon: badge.icon,
                description: badge.description,
              });
            }
          }

          if (badges.length > 0) {
            setNewBadges(badges);
            setCurrentBadgeIndex(0);
            setIsVisible(true);
          }
        }
      } catch {
        // Silently fail if not authenticated
      }
    };

    // Check on mount and every 30 seconds
    checkForBadges();
    const interval = setInterval(checkForBadges, 30000);

    return () => clearInterval(interval);
  }, [checkBadges, badgeDefinitions]);

  // Auto-hide after 5 seconds
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        if (currentBadgeIndex < newBadges.length - 1) {
          setCurrentBadgeIndex((prev) => prev + 1);
        } else {
          handleClose();
        }
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, currentBadgeIndex, newBadges.length]);

  const handleClose = () => {
    setIsVisible(false);
    setNewBadges([]);
    onClose?.();
  };

  if (!isVisible || newBadges.length === 0) {
    return null;
  }

  const currentBadge = newBadges[currentBadgeIndex];

  return (
    <div style={styles.container}>
      <div style={styles.notification}>
        <div style={styles.glow} />
        <div style={styles.content}>
          <div style={styles.header}>
            <span style={styles.label}>Badge Unlocked!</span>
            <button onClick={handleClose} style={styles.closeButton}>
              ✕
            </button>
          </div>

          <div style={styles.badgeDisplay}>
            <div style={styles.iconContainer}>
              <span style={styles.icon}>{currentBadge.icon}</span>
            </div>
            <div style={styles.badgeInfo}>
              <span style={styles.badgeName}>{currentBadge.name}</span>
              <span style={styles.badgeDescription}>{currentBadge.description}</span>
            </div>
          </div>

          {newBadges.length > 1 && (
            <div style={styles.pagination}>
              {newBadges.map((_, index) => (
                <div
                  key={index}
                  style={{
                    ...styles.dot,
                    ...(index === currentBadgeIndex ? styles.activeDot : {}),
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Standalone toast function for programmatic use
export const showBadgeToast = (badge: NewBadge) => {
  // This would integrate with a toast library in production
  console.log("Badge earned:", badge);
};

const styles: Record<string, CSSProperties> = {
  container: {
    position: "fixed",
    top: "20px",
    right: "20px",
    zIndex: 10000,
    animation: "slideIn 0.3s ease-out",
  },
  notification: {
    position: "relative",
    width: "320px",
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
    borderRadius: "16px",
    border: "1px solid rgba(139, 92, 246, 0.3)",
    overflow: "hidden",
    boxShadow: "0 10px 40px rgba(139, 92, 246, 0.3)",
  },
  glow: {
    position: "absolute",
    top: "-50%",
    left: "-50%",
    width: "200%",
    height: "200%",
    background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)",
    animation: "pulse 2s ease-in-out infinite",
  },
  content: {
    position: "relative",
    padding: "16px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  label: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#8B5CF6",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  closeButton: {
    width: "24px",
    height: "24px",
    border: "none",
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "6px",
    color: "#a3a3a3",
    cursor: "pointer",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeDisplay: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  iconContainer: {
    width: "64px",
    height: "64px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 20px rgba(139, 92, 246, 0.4)",
  },
  icon: {
    fontSize: "32px",
  },
  badgeInfo: {
    flex: 1,
  },
  badgeName: {
    display: "block",
    fontSize: "18px",
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: "4px",
  },
  badgeDescription: {
    display: "block",
    fontSize: "13px",
    color: "#a3a3a3",
    lineHeight: "1.4",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    gap: "6px",
    marginTop: "16px",
  },
  dot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "rgba(255, 255, 255, 0.2)",
    transition: "all 0.2s ease",
  },
  activeDot: {
    width: "18px",
    borderRadius: "3px",
    background: "#8B5CF6",
  },
};

// Add keyframe animations via style tag
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(100px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    @keyframes pulse {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }
  `;
  document.head.appendChild(styleSheet);
}
