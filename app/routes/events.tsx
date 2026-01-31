import { useNavigate } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

export default function EventsPage() {
  const navigate = useNavigate();
  const activeEvents = useQuery(api.events.getActiveEvents);
  const upcomingEvents = useQuery(api.events.getUpcomingEvents, { limit: 5 });
  const joinEvent = useMutation(api.events.joinEvent);

  const handleJoin = async (eventId: string) => {
    try {
      await joinEvent({ eventId: eventId as Id<"events"> });
    } catch (error) {
      console.error("Failed to join event:", error);
    }
  };

  const formatTimeUntil = (ms: number): string => {
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
  };

  const formatWatchTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);

    if (hours > 0) {
      return `${hours}h`;
    }

    const minutes = Math.floor(seconds / 60);

    return `${minutes}m`;
  };

  const getEventTypeLabel = (type: string): string => {
    const types: Record<string, string> = {
      community_watch: "Community Watch",
      marathon: "Marathon",
      challenge_event: "Challenge",
      seasonal: "Seasonal",
      special: "Special Event",
    };

    return types[type] || "Event";
  };

  const currentEvents = activeEvents?.filter((e) => e.isActive && !e.isUpcoming) || [];
  const upcomingList = activeEvents?.filter((e) => e.isUpcoming) || [];

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <button onClick={() => navigate(-1)} style={styles.backButton}>
            ← Back
          </button>
          <h1 style={styles.title}>Events</h1>
          <p style={styles.subtitle}>
            Join community events for bonus XP and exclusive rewards
          </p>
        </div>

        {/* Active Events */}
        {currentEvents.length > 0 && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <span style={styles.liveIndicator}>LIVE</span>
              Active Events
            </h2>
            <div style={styles.eventGrid}>
              {currentEvents.map((event) => (
                <div
                  key={event._id}
                  style={{
                    ...styles.eventCard,
                    background: `linear-gradient(135deg, ${event.color}30 0%, #1a1a1a 100%)`,
                    borderColor: event.color + "40",
                  }}
                >
                  <div style={styles.eventHeader}>
                    <span style={styles.eventType}>
                      {getEventTypeLabel(event.type)}
                    </span>
                    <span style={styles.eventTime}>
                      Ends in {formatTimeUntil(event.timeUntilEnd)}
                    </span>
                  </div>

                  <h3 style={styles.eventName}>{event.name}</h3>
                  <p style={styles.eventDescription}>{event.description}</p>

                  <div style={styles.eventStats}>
                    <div style={styles.eventStat}>
                      <span style={styles.eventStatValue}>
                        {event.participantCount}
                      </span>
                      <span style={styles.eventStatLabel}>Participants</span>
                    </div>
                    <div style={styles.eventStat}>
                      <span style={styles.eventStatValue}>
                        {formatWatchTime(event.totalWatchTime)}
                      </span>
                      <span style={styles.eventStatLabel}>Watch Time</span>
                    </div>
                    {event.xpMultiplier && event.xpMultiplier > 1 && (
                      <div style={styles.eventStat}>
                        <span
                          style={{
                            ...styles.eventStatValue,
                            color: "#22c55e",
                          }}
                        >
                          {event.xpMultiplier}x
                        </span>
                        <span style={styles.eventStatLabel}>XP Bonus</span>
                      </div>
                    )}
                  </div>

                  {event.communityGoal && (
                    <div style={styles.goalSection}>
                      <div style={styles.goalHeader}>
                        <span style={styles.goalLabel}>Community Goal</span>
                        <span style={styles.goalProgress}>
                          {event.communityGoal.current.toLocaleString()} /{" "}
                          {event.communityGoal.target.toLocaleString()}
                        </span>
                      </div>
                      <div style={styles.goalBar}>
                        <div
                          style={{
                            ...styles.goalFill,
                            width: `${Math.min(100, (event.communityGoal.current / event.communityGoal.target) * 100)}%`,
                            backgroundColor: event.color,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleJoin(event._id)}
                    style={{
                      ...styles.joinButton,
                      backgroundColor: event.color,
                    }}
                  >
                    Join Event
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Events */}
        {upcomingList.length > 0 && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Upcoming Events</h2>
            <div style={styles.upcomingList}>
              {upcomingList.map((event) => (
                <div
                  key={event._id}
                  style={{
                    ...styles.upcomingCard,
                    borderLeftColor: event.color,
                  }}
                >
                  <div style={styles.upcomingInfo}>
                    <span style={styles.upcomingType}>
                      {getEventTypeLabel(event.type)}
                    </span>
                    <h3 style={styles.upcomingName}>{event.name}</h3>
                    <p style={styles.upcomingDescription}>{event.description}</p>
                  </div>
                  <div style={styles.upcomingMeta}>
                    <span style={styles.upcomingTime}>
                      Starts in {formatTimeUntil(event.timeUntilStart)}
                    </span>
                    {event.xpMultiplier && event.xpMultiplier > 1 && (
                      <span style={styles.upcomingBonus}>
                        {event.xpMultiplier}x XP
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* No Events */}
        {(!activeEvents || activeEvents.length === 0) && (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>📅</span>
            <h3 style={styles.emptyTitle}>No Active Events</h3>
            <p style={styles.emptyText}>
              Check back soon for community events with bonus XP and rewards!
            </p>
          </div>
        )}

        {/* Info Section */}
        <section style={styles.infoSection}>
          <h3 style={styles.infoTitle}>About Events</h3>
          <div style={styles.infoGrid}>
            <div style={styles.infoCard}>
              <span style={styles.infoIcon}>🎯</span>
              <h4 style={styles.infoCardTitle}>Community Goals</h4>
              <p style={styles.infoCardText}>
                Work together to reach shared milestones and unlock community rewards.
              </p>
            </div>
            <div style={styles.infoCard}>
              <span style={styles.infoIcon}>✨</span>
              <h4 style={styles.infoCardTitle}>XP Multipliers</h4>
              <p style={styles.infoCardText}>
                Earn bonus XP during events to level up faster.
              </p>
            </div>
            <div style={styles.infoCard}>
              <span style={styles.infoIcon}>🏆</span>
              <h4 style={styles.infoCardTitle}>Exclusive Badges</h4>
              <p style={styles.infoCardText}>
                Participate in events to earn limited-edition badges.
              </p>
            </div>
          </div>
        </section>
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
    maxWidth: "900px",
    margin: "0 auto",
  },
  header: {
    marginBottom: "32px",
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
    margin: "0 0 8px 0",
    fontSize: "32px",
    fontWeight: "bold",
  },
  subtitle: {
    margin: 0,
    fontSize: "16px",
    color: "#888",
  },
  section: {
    marginBottom: "40px",
  },
  sectionTitle: {
    margin: "0 0 20px 0",
    fontSize: "20px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  liveIndicator: {
    padding: "4px 10px",
    backgroundColor: "#ef4444",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.5px",
  },
  eventGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "20px",
  },
  eventCard: {
    borderRadius: "16px",
    border: "1px solid",
    padding: "24px",
    transition: "transform 0.2s ease",
  },
  eventHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  eventType: {
    fontSize: "12px",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  eventTime: {
    fontSize: "13px",
    color: "#888",
  },
  eventName: {
    margin: "0 0 8px 0",
    fontSize: "22px",
    fontWeight: "700",
  },
  eventDescription: {
    margin: "0 0 20px 0",
    fontSize: "14px",
    color: "#a3a3a3",
    lineHeight: "1.5",
  },
  eventStats: {
    display: "flex",
    gap: "24px",
    padding: "16px 0",
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    marginBottom: "16px",
  },
  eventStat: {
    textAlign: "center",
  },
  eventStatValue: {
    display: "block",
    fontSize: "20px",
    fontWeight: "700",
  },
  eventStatLabel: {
    display: "block",
    fontSize: "11px",
    color: "#888",
    textTransform: "uppercase",
    marginTop: "4px",
  },
  goalSection: {
    marginBottom: "20px",
  },
  goalHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "8px",
  },
  goalLabel: {
    fontSize: "13px",
    fontWeight: "600",
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
    padding: "14px",
    border: "none",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "600",
    color: "#fff",
    cursor: "pointer",
    transition: "transform 0.2s ease, opacity 0.2s ease",
  },
  upcomingList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  upcomingCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    backgroundColor: "#1a1a1a",
    borderRadius: "12px",
    borderLeft: "4px solid",
  },
  upcomingInfo: {
    flex: 1,
  },
  upcomingType: {
    display: "block",
    fontSize: "11px",
    color: "#888",
    textTransform: "uppercase",
    marginBottom: "4px",
  },
  upcomingName: {
    margin: "0 0 4px 0",
    fontSize: "16px",
    fontWeight: "600",
  },
  upcomingDescription: {
    margin: 0,
    fontSize: "13px",
    color: "#666",
  },
  upcomingMeta: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "4px",
  },
  upcomingTime: {
    fontSize: "14px",
    color: "#8B5CF6",
    fontWeight: "500",
  },
  upcomingBonus: {
    padding: "4px 8px",
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#22c55e",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    backgroundColor: "#1a1a1a",
    borderRadius: "16px",
  },
  emptyIcon: {
    fontSize: "48px",
    display: "block",
    marginBottom: "16px",
  },
  emptyTitle: {
    margin: "0 0 8px 0",
    fontSize: "20px",
    fontWeight: "600",
  },
  emptyText: {
    margin: 0,
    fontSize: "14px",
    color: "#666",
  },
  infoSection: {
    backgroundColor: "#1a1a1a",
    borderRadius: "16px",
    padding: "24px",
  },
  infoTitle: {
    margin: "0 0 20px 0",
    fontSize: "18px",
    fontWeight: "600",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
  },
  infoCard: {
    padding: "16px",
    backgroundColor: "#262626",
    borderRadius: "12px",
    textAlign: "center",
  },
  infoIcon: {
    fontSize: "32px",
    display: "block",
    marginBottom: "12px",
  },
  infoCardTitle: {
    margin: "0 0 8px 0",
    fontSize: "14px",
    fontWeight: "600",
  },
  infoCardText: {
    margin: 0,
    fontSize: "13px",
    color: "#888",
    lineHeight: "1.4",
  },
};
