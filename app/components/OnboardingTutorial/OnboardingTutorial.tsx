import { useState, type CSSProperties } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";

interface OnboardingTutorialProps {
  onComplete?: () => void;
}

export const OnboardingTutorial = ({ onComplete }: OnboardingTutorialProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const onboardingStatus = useQuery(api.onboarding.getOnboardingStatus);
  const startOnboarding = useMutation(api.onboarding.startOnboarding);
  const skipOnboarding = useMutation(api.onboarding.skipOnboarding);
  const claimRewards = useMutation(api.onboarding.claimOnboardingRewards);

  // Don't show if loading or already completed
  if (!onboardingStatus) return null;
  if (onboardingStatus.isComplete && onboardingStatus.onboardingBadgeClaimed) return null;
  if (onboardingStatus.steps?.some((s: any) => s.id === "tutorialComplete" && s.completed)) return null;

  const handleStart = async () => {
    if (!onboardingStatus.isStarted) {
      await startOnboarding();
    }
    setIsExpanded(true);
  };

  const handleSkip = async () => {
    await skipOnboarding();
    onComplete?.();
  };

  const handleClaimRewards = async () => {
    try {
      await claimRewards();
      onComplete?.();
    } catch (error) {
      console.error("Failed to claim rewards:", error);
    }
  };

  const { steps, completedCount, totalSteps, totalXpAvailable } = onboardingStatus;
  const progress = totalSteps ? (completedCount || 0) / totalSteps : 0;
  const allStepsComplete = completedCount === totalSteps && totalSteps > 0;

  if (!isExpanded) {
    return (
      <button onClick={handleStart} style={styles.minimizedButton}>
        <span style={styles.minimizedIcon}>🎓</span>
        <span style={styles.minimizedText}>
          {completedCount || 0}/{totalSteps || 0} Tutorial
        </span>
        <div style={styles.minimizedProgress}>
          <div
            style={{ ...styles.minimizedProgressFill, width: `${progress * 100}%` }}
          />
        </div>
      </button>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerIcon}>🎓</span>
          <div>
            <h3 style={styles.title}>Getting Started</h3>
            <p style={styles.subtitle}>
              Complete these steps to earn {totalXpAvailable} XP and a special badge!
            </p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <button onClick={() => setIsExpanded(false)} style={styles.minimizeButton}>
            −
          </button>
          <button onClick={handleSkip} style={styles.skipButton}>
            Skip
          </button>
        </div>
      </div>

      <div style={styles.progressSection}>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${progress * 100}%` }} />
        </div>
        <span style={styles.progressText}>
          {completedCount || 0} of {totalSteps || 0} completed
        </span>
      </div>

      <div style={styles.stepList}>
        {steps?.map((step: any, index: number) => (
          <div
            key={step.id}
            style={{
              ...styles.stepItem,
              ...(step.completed ? styles.stepItemCompleted : {}),
            }}
          >
            <div
              style={{
                ...styles.stepNumber,
                ...(step.completed ? styles.stepNumberCompleted : {}),
              }}
            >
              {step.completed ? "✓" : index + 1}
            </div>
            <div style={styles.stepContent}>
              <span style={styles.stepTitle}>{step.title}</span>
              <span style={styles.stepDescription}>{step.description}</span>
            </div>
            <div style={styles.stepReward}>
              {step.completed ? (
                <span style={styles.stepRewardEarned}>+{step.xpReward} XP</span>
              ) : (
                <span style={styles.stepRewardPending}>+{step.xpReward}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {allStepsComplete && !onboardingStatus.onboardingBadgeClaimed && (
        <div style={styles.completionSection}>
          <div style={styles.completionContent}>
            <span style={styles.completionIcon}>🎉</span>
            <div>
              <span style={styles.completionTitle}>All steps completed!</span>
              <span style={styles.completionDescription}>
                Claim your rewards now
              </span>
            </div>
          </div>
          <button onClick={handleClaimRewards} style={styles.claimButton}>
            Claim Rewards
          </button>
        </div>
      )}

      <div style={styles.footer}>
        <span style={styles.footerText}>
          You can complete these in any order
        </span>
      </div>
    </div>
  );
};

// Compact version for sidebar/header
export const OnboardingProgress = () => {
  const onboardingStatus = useQuery(api.onboarding.getOnboardingStatus);

  if (!onboardingStatus) return null;
  if (onboardingStatus.isComplete && onboardingStatus.onboardingBadgeClaimed) return null;

  const { completedCount, totalSteps } = onboardingStatus;
  const progress = totalSteps ? (completedCount || 0) / totalSteps : 0;

  return (
    <div style={styles.compactContainer}>
      <span style={styles.compactIcon}>🎓</span>
      <div style={styles.compactInfo}>
        <span style={styles.compactText}>Tutorial</span>
        <div style={styles.compactProgress}>
          <div
            style={{ ...styles.compactProgressFill, width: `${progress * 100}%` }}
          />
        </div>
      </div>
      <span style={styles.compactCount}>
        {completedCount || 0}/{totalSteps || 0}
      </span>
    </div>
  );
};

const styles: Record<string, CSSProperties> = {
  container: {
    backgroundColor: "#1a1a1a",
    borderRadius: "16px",
    border: "1px solid #8B5CF6",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "16px",
    background: "linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, transparent 100%)",
  },
  headerLeft: {
    display: "flex",
    gap: "12px",
  },
  headerIcon: {
    fontSize: "28px",
  },
  title: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "600",
    color: "#fff",
  },
  subtitle: {
    margin: "4px 0 0 0",
    fontSize: "13px",
    color: "#888",
  },
  headerRight: {
    display: "flex",
    gap: "8px",
  },
  minimizeButton: {
    width: "28px",
    height: "28px",
    border: "none",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: "6px",
    color: "#888",
    fontSize: "18px",
    cursor: "pointer",
  },
  skipButton: {
    padding: "6px 12px",
    border: "none",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: "6px",
    color: "#888",
    fontSize: "12px",
    cursor: "pointer",
  },
  progressSection: {
    padding: "0 16px 16px",
  },
  progressBar: {
    height: "6px",
    backgroundColor: "#262626",
    borderRadius: "3px",
    overflow: "hidden",
    marginBottom: "8px",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#8B5CF6",
    borderRadius: "3px",
    transition: "width 0.3s ease",
  },
  progressText: {
    fontSize: "12px",
    color: "#666",
  },
  stepList: {
    padding: "0 16px",
  },
  stepItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 0",
    borderBottom: "1px solid #262626",
  },
  stepItemCompleted: {
    opacity: 0.7,
  },
  stepNumber: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    backgroundColor: "#262626",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "600",
    color: "#888",
    flexShrink: 0,
  },
  stepNumberCompleted: {
    backgroundColor: "#22c55e",
    color: "#fff",
  },
  stepContent: {
    flex: 1,
    minWidth: 0,
  },
  stepTitle: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#fff",
  },
  stepDescription: {
    display: "block",
    fontSize: "12px",
    color: "#666",
    marginTop: "2px",
  },
  stepReward: {},
  stepRewardEarned: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#22c55e",
  },
  stepRewardPending: {
    fontSize: "12px",
    color: "#8B5CF6",
  },
  completionSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    margin: "16px",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderRadius: "12px",
    border: "1px solid rgba(34, 197, 94, 0.3)",
  },
  completionContent: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  completionIcon: {
    fontSize: "24px",
  },
  completionTitle: {
    display: "block",
    fontSize: "14px",
    fontWeight: "600",
    color: "#22c55e",
  },
  completionDescription: {
    display: "block",
    fontSize: "12px",
    color: "#22c55e",
    opacity: 0.8,
  },
  claimButton: {
    padding: "10px 20px",
    backgroundColor: "#22c55e",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  footer: {
    padding: "12px 16px",
    borderTop: "1px solid #262626",
    textAlign: "center",
  },
  footerText: {
    fontSize: "12px",
    color: "#666",
  },
  // Minimized button styles
  minimizedButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    backgroundColor: "#1a1a1a",
    border: "1px solid #8B5CF6",
    borderRadius: "20px",
    cursor: "pointer",
  },
  minimizedIcon: {
    fontSize: "16px",
  },
  minimizedText: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#fff",
  },
  minimizedProgress: {
    width: "40px",
    height: "4px",
    backgroundColor: "#262626",
    borderRadius: "2px",
    overflow: "hidden",
  },
  minimizedProgressFill: {
    height: "100%",
    backgroundColor: "#8B5CF6",
    borderRadius: "2px",
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
  compactIcon: {
    fontSize: "14px",
  },
  compactInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  compactText: {
    fontSize: "11px",
    fontWeight: "500",
    color: "#fff",
  },
  compactProgress: {
    width: "40px",
    height: "3px",
    backgroundColor: "rgba(139, 92, 246, 0.3)",
    borderRadius: "2px",
    overflow: "hidden",
  },
  compactProgressFill: {
    height: "100%",
    backgroundColor: "#8B5CF6",
    borderRadius: "2px",
  },
  compactCount: {
    fontSize: "11px",
    color: "#8B5CF6",
    fontWeight: "600",
  },
};
