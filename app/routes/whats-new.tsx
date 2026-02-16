import { useState } from "react";
import { useNavigate } from "react-router";
import type { MetaFunction } from "react-router";
import { generateMetaTags } from "~/utils/seo";

export const meta: MetaFunction = () => {
  return generateMetaTags({
    title: "What's New - Latest Updates & Features",
    description:
      "See what's new on Watch Party! Check out the latest features, improvements, and updates we've shipped to make your watch party experience even better.",
  });
};

type UpdateCategory = "all" | "feature" | "improvement" | "social";

interface UpdateEntry {
  id: string;
  date: string;
  title: string;
  description: string;
  category: "feature" | "improvement" | "social";
  highlights: string[];
}

const UPDATES: UpdateEntry[] = [
  {
    id: "2026-02-15-moderation",
    date: "February 15, 2026",
    title: "Room Moderation Tools",
    description:
      "Room hosts now have more control over their watch parties with new moderation features.",
    category: "feature",
    highlights: [
      "Hosts can mute or ban disruptive users from rooms",
      "Assign moderator roles to trusted members",
      "Muted users are automatically unmuted after a set duration",
    ],
  },
  {
    id: "2026-02-10-templates",
    date: "February 10, 2026",
    title: "Room Templates",
    description:
      "Save and reuse your favorite room setups with room templates. No more starting from scratch every time.",
    category: "feature",
    highlights: [
      "Create templates from your existing room configurations",
      "Start a new watch party from a template in one click",
      "Share templates with friends and groups",
    ],
  },
  {
    id: "2026-02-05-streaks",
    date: "February 5, 2026",
    title: "Watch Streaks & Daily Rewards",
    description:
      "Stay consistent and get rewarded! Track your daily watch streaks and compete with friends.",
    category: "feature",
    highlights: [
      "Build daily watch streaks by watching every day",
      "See your streak displayed right on the home screen",
      "Streak leaderboard to see who's the most dedicated",
    ],
  },
  {
    id: "2026-01-28-groups",
    date: "January 28, 2026",
    title: "Groups & Communities",
    description:
      "Create and join groups to find people who share your interests and watch together regularly.",
    category: "social",
    highlights: [
      "Create groups around shared interests (anime, movies, music, etc.)",
      "Invite friends to your groups",
      "Group members can easily start watch parties together",
    ],
  },
  {
    id: "2026-01-20-playlists",
    date: "January 20, 2026",
    title: "Playlists",
    description:
      "Queue up videos ahead of time with the new playlist feature. Plan your perfect watch party lineup.",
    category: "feature",
    highlights: [
      "Create and manage custom playlists",
      "Add videos to playlists from any room",
      "Load a playlist into a room to auto-queue videos",
    ],
  },
  {
    id: "2026-01-15-activity",
    date: "January 15, 2026",
    title: "Activity Feed",
    description:
      "Stay in the loop with what your friends are up to. See when they start watch parties, earn badges, and more.",
    category: "social",
    highlights: [
      "See a live feed of friend activity",
      "Know when friends start or join watch parties",
      "Track badge unlocks and milestone achievements",
    ],
  },
  {
    id: "2026-01-10-leaderboards",
    date: "January 10, 2026",
    title: "Leaderboards",
    description:
      "See how you stack up against the community. Compete across multiple categories and time periods.",
    category: "feature",
    highlights: [
      "Rankings for watch time, parties hosted, messages sent, and reactions",
      "Filter by weekly, monthly, or all-time stats",
      "See your personal rank and percentile",
    ],
  },
  {
    id: "2026-01-05-notifications",
    date: "January 5, 2026",
    title: "Notifications & Alerts",
    description:
      "Never miss a moment. Get notified when friends invite you, events start, or your streaks are about to end.",
    category: "improvement",
    highlights: [
      "Real-time notification bell on the home screen",
      "Friend request and party invitation alerts",
      "Streak reminder notifications",
    ],
  },
  {
    id: "2025-12-20-friends",
    date: "December 20, 2025",
    title: "Friends System",
    description:
      "Add friends, manage requests, and see who's online. Watching together is better with friends.",
    category: "social",
    highlights: [
      "Send and accept friend requests",
      "See your friends list and their online status",
      "Quickly invite friends to your current room",
    ],
  },
  {
    id: "2025-12-15-reactions",
    date: "December 15, 2025",
    title: "Emoji Reactions & Polls",
    description:
      "Express yourself during watch parties with emoji reactions, and run polls to decide what to watch next.",
    category: "feature",
    highlights: [
      "React to moments in the video with floating emojis",
      "Create polls for the room to vote on",
      "See real-time poll results as people vote",
    ],
  },
  {
    id: "2025-12-10-bookmarks",
    date: "December 10, 2025",
    title: "Room Bookmarks & Watch History",
    description:
      "Save your favorite rooms and easily revisit them later. Your watch history is always available.",
    category: "improvement",
    highlights: [
      "Bookmark rooms to save them for later",
      "Full watch history so you can find past sessions",
      "Quick access to recent and saved rooms from the home screen",
    ],
  },
  {
    id: "2025-12-01-scheduled",
    date: "December 1, 2025",
    title: "Scheduled Watch Parties",
    description:
      "Plan ahead by scheduling watch parties in advance. Set a date and time, and invite people to join.",
    category: "feature",
    highlights: [
      "Schedule parties for a specific date and time",
      "Send invitations to friends",
      "Upcoming parties displayed on the home screen",
    ],
  },
  {
    id: "2025-11-20-theme",
    date: "November 20, 2025",
    title: "Theme Customization",
    description: "Make Watch Party yours with customizable theme settings.",
    category: "improvement",
    highlights: [
      "Dark mode enabled by default for comfortable viewing",
      "Adjustable theme settings accessible from the home screen",
    ],
  },
  {
    id: "2025-11-01-launch",
    date: "November 1, 2025",
    title: "Watch Party Launch",
    description:
      "The initial release of Watch Party! Watch YouTube videos together with friends in perfect sync.",
    category: "feature",
    highlights: [
      "Create rooms and invite friends via shareable links",
      "Synchronized video playback across all viewers",
      "Real-time chat alongside the video",
      "Simple room creation with custom or random room names",
    ],
  },
];

const getCategoryLabel = (category: UpdateEntry["category"]): string => {
  switch (category) {
    case "feature":
      return "New Feature";
    case "improvement":
      return "Improvement";
    case "social":
      return "Social";
  }
};

const getCategoryColor = (category: UpdateEntry["category"]): string => {
  switch (category) {
    case "feature":
      return "#8B5CF6";
    case "improvement":
      return "#3B82F6";
    case "social":
      return "#EC4899";
  }
};

export default function WhatsNewPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<UpdateCategory>("all");

  const filteredUpdates =
    filter === "all"
      ? UPDATES
      : UPDATES.filter((u) => u.category === filter);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <button onClick={() => navigate(-1)} style={styles.backButton}>
            ← Back
          </button>
          <h1 style={styles.title}>What's New</h1>
          <p style={styles.subtitle}>
            The latest features and updates shipped to Watch Party
          </p>
        </div>

        {/* Filter Tabs */}
        <div style={styles.filterTabs}>
          {(["all", "feature", "improvement", "social"] as UpdateCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              style={{
                ...styles.filterTab,
                ...(filter === cat ? styles.filterTabActive : {}),
              }}
            >
              {cat === "all"
                ? "All Updates"
                : cat === "feature"
                  ? "New Features"
                  : cat === "improvement"
                    ? "Improvements"
                    : "Social"}
            </button>
          ))}
        </div>

        {/* Updates Timeline */}
        <div style={styles.timeline}>
          {filteredUpdates.map((update) => (
            <div key={update.id} style={styles.updateCard}>
              <div style={styles.updateHeader}>
                <span
                  style={{
                    ...styles.categoryBadge,
                    backgroundColor: getCategoryColor(update.category) + "20",
                    color: getCategoryColor(update.category),
                    borderColor: getCategoryColor(update.category) + "40",
                  }}
                >
                  {getCategoryLabel(update.category)}
                </span>
                <span style={styles.updateDate}>{update.date}</span>
              </div>

              <h3 style={styles.updateTitle}>{update.title}</h3>
              <p style={styles.updateDescription}>{update.description}</p>

              <ul style={styles.highlightList}>
                {update.highlights.map((highlight, i) => (
                  <li key={i} style={styles.highlightItem}>
                    <span
                      style={{
                        ...styles.highlightDot,
                        backgroundColor: getCategoryColor(update.category),
                      }}
                    />
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {filteredUpdates.length === 0 && (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No updates in this category yet.</p>
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
  filterTabs: {
    display: "flex",
    gap: "8px",
    marginBottom: "32px",
    flexWrap: "wrap" as const,
  },
  filterTab: {
    padding: "8px 16px",
    backgroundColor: "transparent",
    border: "1px solid #333",
    borderRadius: "20px",
    color: "#888",
    cursor: "pointer",
    fontSize: "13px",
    transition: "all 0.2s",
  },
  filterTabActive: {
    borderColor: "#8B5CF6",
    color: "#8B5CF6",
  },
  timeline: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "20px",
  },
  updateCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: "16px",
    padding: "24px",
    border: "1px solid #333",
  },
  updateHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  categoryBadge: {
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    border: "1px solid",
  },
  updateDate: {
    fontSize: "13px",
    color: "#666",
  },
  updateTitle: {
    margin: "0 0 8px 0",
    fontSize: "20px",
    fontWeight: "600",
  },
  updateDescription: {
    margin: "0 0 16px 0",
    fontSize: "14px",
    color: "#a3a3a3",
    lineHeight: "1.5",
  },
  highlightList: {
    margin: 0,
    padding: 0,
    listStyle: "none",
    display: "flex",
    flexDirection: "column" as const,
    gap: "10px",
  },
  highlightItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "14px",
    color: "#d4d4d4",
  },
  highlightDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  emptyState: {
    textAlign: "center" as const,
    padding: "60px 20px",
    backgroundColor: "#1a1a1a",
    borderRadius: "16px",
  },
  emptyText: {
    margin: 0,
    fontSize: "14px",
    color: "#666",
  },
};
