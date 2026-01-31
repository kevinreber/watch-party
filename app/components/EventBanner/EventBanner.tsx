import { type CSSProperties } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

interface EventBannerProps {
  compact?: boolean;
}

export const EventBanner = ({ compact = false }: EventBannerProps) => {
  const activeEvents = useQuery(api.events.getActiveEvents);
  const joinEvent = useMutation(api.events.joinEvent);

  if (!activeEvents || activeEvents.length === 0) {
    return null;
  }

  // Show only currently active events (not upcoming)
  const currentEvents = activeEvents.filter((e) => e.isActive && !e.isUpcoming);

  if (currentEvents.length === 0) {
    // Show upcoming event teaser
    const upcomingEvent = activeEvents.find((e) => e.isUpcoming);
    if (upcomingEvent && compact) {
      return (
        <div style={{ ...styles.compactContainer, backgroundColor: upcomingEvent.color + "20" }}>
          <span style={styles.compactIcon}>📅</span>
          <span style={styles.compactText}>
            {upcomingEvent.name} starts in {formatTimeUntil(upcomingEvent.timeUntilStart)}
          </span>
        </div>
      );
    }

    return null;
  }

  const event = currentEvents[0];

  const handleJoin = async () => {
    try {
      await joinEvent({ eventId: event._id as Id<"events"> });
    } catch (error) {
      console.error("Failed to join event:", error);
    }
  };

  if (compact) {
    return (
      <div
        style={{
          ...styles.compactContainer,
          background: `linear-gradient(135deg, ${event.color}40 0%, ${event.color}20 100%)`,
          borderColor: event.color,
        }}
      >
        <span style={styles.compactLive}>LIVE</span>
        <span style={styles.compactEventName}>{event.name}</span>
        {event.xpMultiplier && event.xpMultiplier > 1 && (
          <span style={styles.compactMultiplier}>{event.xpMultiplier}x XP</span>
        )}
      </div>
    );
  }

  const progressPercent = event.communityGoal
    ? Math.min(100, (event.communityGoal.current / event.communityGoal.target) * 100)
    : null;

  return (
    <div
      style={{
        ...styles.container,
        background: `linear-gradient(135deg, ${event.color}30 0%, #1a1a1a 100%)`,
        borderColor: event.color + "40",
      }}
    >
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.liveBadge}>LIVE</span>
          <span style={styles.eventType}>{formatEventType(event.type)}</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.timeRemaining}>
            Ends in {formatTimeUntil(event.timeUntilEnd)}
          </span>
        </div>
      </div>

      <h3 style={styles.eventName}>{event.name}</h3>
      <p style={styles.eventDescription}>{event.description}</p>

      <div style={styles.stats}>
        <div style={styles.statItem}>
          <span style={styles.statValue}>{event.participantCount}</span>
          <span style={styles.statLabel}>Participants</span>
        </div>
        <div style={styles.statDivider} />
        <div style={styles.statItem}>
          <span style={styles.statValue}>{formatWatchTime(event.totalWatchTime)}</span>
          <span style={styles.statLabel}>Watch Time</span>
        </div>
        {event.xpMultiplier && event.xpMultiplier > 1 && (
          <>
            <div style={styles.statDivider} />
            <div style={styles.statItem}>
              <span style={{ ...styles.statValue, color: "#22c55e" }}>
                {event.xpMultiplier}x
              </span>
              <span style={styles.statLabel}>XP Bonus</span>
            </div>
          </>
        )}
      </div>

      {event.communityGoal && progressPercent !== null && (
        <div style={styles.goalSection}>
          <div style={styles.goalHeader}>
            <span style={styles.goalLabel}>Community Goal</span>
            <span style={styles.goalProgress}>
              {event.communityGoal.current.toLocaleString()} / {event.communityGoal.target.toLocaleString()}
            </span>
          </div>
          <div style={styles.goalBar}>
            <div
              style={{
                ...styles.goalFill,
                width: `${progressPercent}%`,
                backgroundColor: event.color,
              }}
            />
          </div>
        </div>
      )}

      <button onClick={handleJoin} style={{ ...styles.joinButton, backgroundColor: event.color }}>
        Join Event
      </button>
    </div>
  );
};

function formatEventType(type: string): string {
  const types: Record<string, string> = {
    community_watch: "Community Watch",
    marathon: "Marathon",
    challenge_event: "Challenge",
    seasonal: "Seasonal Event",
    special: "Special Event",
  };

  return types[type] || "Event";
}

function formatTimeUntil(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);

    return `${days}d ${hours % 24}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

function formatWatchTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);

  if (hours > 0) {
    return `${hours}h`;
  }

  const minutes = Math.floor(seconds / 60);

  return `${minutes}m`;
}

const styles: Record<string, CSSProperties> = {
  container: {
    borderRadius: "16px",
    padding: "20px",
    border: "1px solid",
    position: "relative",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  liveBadge: {
    padding: "4px 8px",
    backgroundColor: "#ef4444",
    borderRadius: "4px",
    fontSize: "10px",
    fontWeight: "700",
    color: "#fff",
    letterSpacing: "0.5px",
    animation: "pulse 2s infinite",
  },
  eventType: {
    fontSize: "12px",
    color: "#888",
    textTransform: "uppercase",
  },
  headerRight: {},
  timeRemaining: {
    fontSize: "13px",
    color: "#888",
  },
  eventName: {
    margin: "0 0 8px 0",
    fontSize: "22px",
    fontWeight: "700",
    color: "#fff",
  },
  eventDescription: {
    margin: "0 0 16px 0",
    fontSize: "14px",
    color: "#a3a3a3",
    lineHeight: "1.5",
  },
  stats: {
    display: "flex",
    alignItems: "center",
    padding: "16px",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: "12px",
    marginBottom: "16px",
  },
  statItem: {
    flex: 1,
    textAlign: "center",
  },
  statValue: {
    display: "block",
    fontSize: "20px",
    fontWeight: "700",
    color: "#fff",
  },
  statLabel: {
    display: "block",
    fontSize: "11px",
    color: "#888",
    textTransform: "uppercase",
    marginTop: "4px",
  },
  statDivider: {
    width: "1px",
    height: "32px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  goalSection: {
    marginBottom: "16px",
  },
  goalHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "8px",
  },
  goalLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#fff",
  },
  goalProgress: {
    fontSize: "13px",
    color: "#888",
  },
  goalBar: {
    height: "8px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: "4px",
    overflow: "hidden",
  },
  goalFill: {
    height: "100%",
    borderRadius: "4px",
    transition: "width 0.5s ease",
  },
  joinButton: {
    width: "100%",
    padding: "12px",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#fff",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  // Compact styles
  compactContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    borderRadius: "20px",
    border: "1px solid",
  },
  compactIcon: {
    fontSize: "14px",
  },
  compactLive: {
    padding: "2px 6px",
    backgroundColor: "#ef4444",
    borderRadius: "4px",
    fontSize: "9px",
    fontWeight: "700",
    color: "#fff",
    letterSpacing: "0.5px",
  },
  compactEventName: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#fff",
    flex: 1,
  },
  compactText: {
    fontSize: "12px",
    color: "#fff",
  },
  compactMultiplier: {
    padding: "2px 6px",
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "600",
    color: "#22c55e",
  },
};
