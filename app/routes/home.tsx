import { useState, useContext, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router";
import type { MetaFunction } from "react-router";
import { useUser, useClerk } from "@clerk/clerk-react";

import { UserContext } from "~/context/UserContext";
import { generateMetaTags } from "~/utils/seo";

export const meta: MetaFunction = () => {
  return generateMetaTags({
    title: "Watch Party - Watch Videos Together with Friends",
    description:
      "Create synchronized watch parties to enjoy YouTube videos with friends in real-time. Features live chat, emoji reactions, polls, and more. Start watching together now!",
  });
};
import { generateName } from "~/utils/generateName";
import { historyService } from "~/services/historyService";
import type { RoomHistory, RoomBookmark, ScheduledParty } from "~/types";
import { scheduledPartyService } from "~/services/scheduledPartyService";

import {
  AuthModal,
  UserProfile,
  ThemeSettings,
  FriendsPanel,
  ScheduledParties,
  WatchHistory,
  RoomBookmarks,
  Notifications,
  NotificationBell,
  ActivityFeed,
  PlaylistsPanel,
  GroupsPanel,
  RoomTemplatesModal,
  StreakDisplay,
} from "~/components";

import "~/styles/landing.css";

// ===== Scroll-triggered animation hook =====
const useScrollReveal = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
};

// ===== Particle config =====
const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  duration: `${8 + Math.random() * 12}s`,
  delay: `${Math.random() * 6}s`,
  driftX: `${(Math.random() - 0.5) * 300}px`,
  driftY: `${-100 - Math.random() * 300}px`,
}));

// ===== Feature cards data =====
const FEATURES = [
  {
    icon: "🎬",
    title: "Synchronized Playback",
    desc: "Everyone watches at the same moment. Play, pause, and seek stays perfectly in sync across all viewers.",
    iconBg: "rgba(99, 102, 241, 0.15)",
    accent: "#6366f1",
  },
  {
    icon: "💬",
    title: "Live Chat & Reactions",
    desc: "React in real-time with messages, emojis, and reactions. Share the moment as it happens.",
    iconBg: "rgba(34, 197, 94, 0.15)",
    accent: "#22c55e",
  },
  {
    icon: "👥",
    title: "Friends & Groups",
    desc: "Build your community. Add friends, create groups, and jump into watch parties together.",
    iconBg: "rgba(59, 130, 246, 0.15)",
    accent: "#3b82f6",
  },
  {
    icon: "🏆",
    title: "Badges & Streaks",
    desc: "Earn achievements and maintain watch streaks. Climb the leaderboard and show off your dedication.",
    iconBg: "rgba(245, 158, 11, 0.15)",
    accent: "#f59e0b",
  },
  {
    icon: "🎵",
    title: "Playlists & Queues",
    desc: "Curate playlists and queue up videos. Let the party keep going without interruption.",
    iconBg: "rgba(236, 72, 153, 0.15)",
    accent: "#ec4899",
  },
  {
    icon: "📅",
    title: "Scheduled Parties",
    desc: "Plan watch events ahead of time. Invite friends and get notified when the party starts.",
    iconBg: "rgba(139, 92, 246, 0.15)",
    accent: "#8b5cf6",
  },
];

// ===== Steps data =====
const STEPS = [
  {
    number: "1",
    title: "Create a Room",
    desc: "Pick a name or generate a random one. Your watch room is ready in seconds.",
  },
  {
    number: "2",
    title: "Share the Link",
    desc: "Send your friends the room link. They join instantly — no account required.",
  },
  {
    number: "3",
    title: "Watch Together",
    desc: "Paste a YouTube URL and everyone watches in sync with live chat and reactions.",
  },
];

export default function Homepage() {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState("");
  const { user, setUser } = useContext(UserContext);
  const { user: clerkUser, isSignedIn, isLoaded } = useUser();
  const { openSignIn, openUserProfile } = useClerk();
  const [isCreating, setIsCreating] = useState(false);

  // Modal states
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [showScheduled, setShowScheduled] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [showGroups, setShowGroups] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  // Quick access data
  const [recentRooms, setRecentRooms] = useState<RoomHistory[]>([]);
  const [bookmarkedRooms, setBookmarkedRooms] = useState<RoomBookmark[]>([]);
  const [upcomingParties, setUpcomingParties] = useState<ScheduledParty[]>([]);

  // Scroll reveal hooks
  const featuresReveal = useScrollReveal();
  const stepsReveal = useScrollReveal();
  const statsReveal = useScrollReveal();
  const ctaReveal = useScrollReveal();

  // Load quick access data
  useEffect(() => {
    setRecentRooms(historyService.getRoomHistory().slice(0, 3));
    setBookmarkedRooms(historyService.getRoomBookmarks().slice(0, 3));
    setUpcomingParties(scheduledPartyService.getUpcomingParties().slice(0, 2));
  }, []);

  // Sync user name with Clerk user if signed in
  useEffect(() => {
    if (clerkUser) {
      const displayName =
        clerkUser.username ||
        clerkUser.firstName ||
        clerkUser.emailAddresses[0]?.emailAddress?.split("@")[0] ||
        "User";
      if (displayName !== user) {
        setUser(displayName);
      }
    }
  }, [clerkUser, user, setUser]);

  const handleRoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomName(e.target.value);
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUser(e.target.value);
  };

  const handleNewRoom = (random = false) => {
    setIsCreating(true);
    let newRoom: string;

    if (random) {
      newRoom = generateName();
      setRoomName(newRoom);
    } else {
      newRoom = roomName;
    }

    const newRoute = newRoom.toLowerCase().split(" ").join("-");
    setTimeout(() => {
      navigate(`/room/${newRoute}`);
    }, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomName.trim()) {
      handleNewRoom();
    }
  };

  const navigateToRoom = (roomId: string) => {
    navigate(`/room/${roomId}`);
  };

  const scrollToCreate = useCallback(() => {
    const el = document.getElementById("create-section");
    el?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleQuickStart = useCallback(() => {
    const name = generateName();
    setRoomName(name);
    setIsCreating(true);
    const newRoute = name.toLowerCase().split(" ").join("-");
    setTimeout(() => {
      navigate(`/room/${newRoute}`);
    }, 300);
  }, [navigate]);

  return (
    <div className="landing-page">
      {/* Floating particles */}
      <div className="landing-particles">
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            className="landing-particle"
            style={{
              left: p.left,
              top: p.top,
              "--duration": p.duration,
              "--delay": p.delay,
              "--drift-x": p.driftX,
              "--drift-y": p.driftY,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerActions}>
          <NotificationBell onClick={() => setShowNotifications(true)} />
          <button onClick={() => setShowTheme(true)} style={styles.headerButton} data-testid="theme-button">
            ⚙️
          </button>
          {isSignedIn ? (
            <button onClick={() => openUserProfile()} style={styles.userButton} data-testid="profile-button">
              {clerkUser?.imageUrl ? (
                <img src={clerkUser.imageUrl} alt={clerkUser.firstName || "User"} style={styles.userAvatar} />
              ) : (
                user.charAt(0).toUpperCase()
              )}
            </button>
          ) : (
            <button onClick={() => openSignIn()} style={styles.signInButton} data-testid="sign-in-button">
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* ===== Hero Section ===== */}
      <section className="landing-hero">
        <div className="landing-hero-glow" />
        <div className="landing-hero-content">
          <div className="landing-logo">
            <svg width="72" height="72" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="url(#heroGradient)" />
              <path d="M18 16L34 24L18 32V16Z" fill="white" />
              <defs>
                <linearGradient id="heroGradient" x1="0" y1="0" x2="48" y2="48">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <h1 className="landing-hero-title">Watch Together, Anywhere</h1>

          <p className="landing-hero-subtitle">
            Create a room, share the link, and enjoy YouTube videos in perfect sync with friends. Real-time chat,
            reactions, and more.
          </p>

          <div className="landing-hero-cta">
            <button className="landing-cta-primary" onClick={handleQuickStart} data-testid="quick-start-button">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7 4L15 10L7 16V4Z" fill="currentColor" />
              </svg>
              Quick Start
            </button>
            <button className="landing-cta-secondary" onClick={scrollToCreate}>
              Create Custom Room
            </button>
          </div>
        </div>

        <div className="landing-scroll-indicator" onClick={scrollToCreate}>
          <span>Explore</span>
          <div className="landing-scroll-arrow" />
        </div>
      </section>

      {/* ===== Features Section ===== */}
      <section className="landing-features" ref={featuresReveal.ref}>
        <div className="landing-section-header">
          <div className="landing-section-badge">Features</div>
          <h2 className="landing-section-title">Everything you need for the perfect watch party</h2>
          <p className="landing-section-subtitle">
            Built for groups who love watching together. Powerful features, zero friction.
          </p>
        </div>

        <div className="landing-features-grid">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className={`landing-feature-card ${featuresReveal.isVisible ? "visible" : ""}`}
              style={{ "--card-accent": feature.accent } as React.CSSProperties}
            >
              <div className="landing-feature-icon" style={{ "--icon-bg": feature.iconBg } as React.CSSProperties}>
                {feature.icon}
              </div>
              <h3 className="landing-feature-title">{feature.title}</h3>
              <p className="landing-feature-desc">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== How It Works ===== */}
      <section className="landing-how-it-works" ref={stepsReveal.ref}>
        <div className="landing-section-header">
          <div className="landing-section-badge">How It Works</div>
          <h2 className="landing-section-title">Up and running in 30 seconds</h2>
          <p className="landing-section-subtitle">No downloads, no plugins. Just share a link and start watching.</p>
        </div>

        <div className="landing-steps">
          {STEPS.map((step) => (
            <div key={step.number} className={`landing-step ${stepsReveal.isVisible ? "visible" : ""}`}>
              <div className="landing-step-number">{step.number}</div>
              <div className="landing-step-content">
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Stats ===== */}
      <section className="landing-stats" ref={statsReveal.ref}>
        <div className="landing-stats-grid">
          {[
            { value: "100%", label: "Free to use" },
            { value: "<1s", label: "Sync latency" },
            { value: "0", label: "Downloads needed" },
            { value: "∞", label: "Watch parties" },
          ].map((stat) => (
            <div key={stat.label} className={`landing-stat ${statsReveal.isVisible ? "visible" : ""}`}>
              <p className="landing-stat-value">{stat.value}</p>
              <p className="landing-stat-label">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Final CTA + Room Creation ===== */}
      <section className="landing-final-cta" id="create-section" ref={ctaReveal.ref}>
        <div className={`landing-final-cta-box ${ctaReveal.isVisible ? "visible" : ""}`}>
          <h2>Ready to watch together?</h2>
          <p>Create a room and share the link with your friends. It takes less than 10 seconds.</p>
          <button className="landing-cta-primary" onClick={handleQuickStart}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7 4L15 10L7 16V4Z" fill="currentColor" />
            </svg>
            Start a Watch Party
          </button>
        </div>
      </section>

      {/* ===== Dashboard Section (existing functionality) ===== */}
      <div className="landing-dashboard">
        {/* Feature buttons - Row 1 */}
        <div style={styles.featureButtons}>
          <button onClick={() => setShowActivity(true)} style={styles.featureButton} data-testid="activity-button">
            🌐 Activity
          </button>
          <button onClick={() => setShowFriends(true)} style={styles.featureButton} data-testid="friends-button">
            👥 Friends
          </button>
          <button onClick={() => setShowGroups(true)} style={styles.featureButton} data-testid="groups-button">
            🏠 Groups
          </button>
          <button onClick={() => setShowPlaylists(true)} style={styles.featureButton} data-testid="playlists-button">
            🎵 Playlists
          </button>
        </div>

        {/* Feature buttons - Row 2 */}
        <div style={styles.featureButtons}>
          <button onClick={() => setShowScheduled(true)} style={styles.featureButton} data-testid="scheduled-button">
            📅 Scheduled
          </button>
          <button onClick={() => setShowHistory(true)} style={styles.featureButton} data-testid="history-button">
            📺 History
          </button>
          <button onClick={() => setShowBookmarks(true)} style={styles.featureButton} data-testid="bookmarks-button">
            🔖 Saved
          </button>
          {isSignedIn && <StreakDisplay compact />}
        </div>

        {/* Admin link */}
        {isSignedIn && (
          <div style={styles.adminLinkContainer}>
            <Link to="/admin" style={styles.adminLink} data-testid="admin-link">
              📊 Admin Dashboard
            </Link>
          </div>
        )}

        {/* What's New */}
        <div style={styles.whatsNewLinkContainer}>
          <Link to="/whats-new" style={styles.whatsNewLink} data-testid="whats-new-link">
            📋 What's New
          </Link>
        </div>

        {/* Form Card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Start a Watch Party</h2>
          <p style={styles.cardSubtitle}>Create a room and invite your friends to watch together</p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Your Name</label>
              <input
                type="text"
                value={user}
                onChange={handleUserChange}
                placeholder="Enter your name"
                style={styles.input}
                data-testid="username-input"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Room Name</label>
              <input
                type="text"
                value={roomName}
                onChange={handleRoomChange}
                placeholder="Enter room name"
                style={styles.input}
                data-testid="room-name-input"
              />
            </div>

            <div style={styles.buttonGroup}>
              <button
                type="submit"
                disabled={!roomName.trim() || isCreating}
                style={{
                  ...styles.primaryButton,
                  opacity: !roomName.trim() || isCreating ? 0.5 : 1,
                  cursor: !roomName.trim() || isCreating ? "not-allowed" : "pointer",
                }}
                data-testid="create-room-button"
              >
                {isCreating ? (
                  <span style={styles.loadingText}>Creating...</span>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Create Room
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleNewRoom(true)}
                disabled={isCreating}
                style={{
                  ...styles.secondaryButton,
                  opacity: isCreating ? 0.5 : 1,
                  cursor: isCreating ? "not-allowed" : "pointer",
                }}
                data-testid="random-room-button"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M4 4V7M4 7H7M4 7L7 4.5C8.5 3 10.5 2.5 12.5 3C14.5 3.5 16 5 16.5 7M16 16V13M16 13H13M16 13L13 15.5C11.5 17 9.5 17.5 7.5 17C5.5 16.5 4 15 3.5 13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Random
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowTemplates(true)}
              style={styles.templateButton}
              data-testid="template-button"
            >
              🎬 Use a Template
            </button>
          </form>
        </div>

        {/* Quick Access Sections */}
        {(recentRooms.length > 0 || bookmarkedRooms.length > 0 || upcomingParties.length > 0) && (
          <div style={styles.quickAccess}>
            {upcomingParties.length > 0 && (
              <div style={styles.quickSection}>
                <h3 style={styles.quickTitle}>Upcoming Parties</h3>
                <div style={styles.quickList}>
                  {upcomingParties.map((party) => (
                    <button key={party.id} onClick={() => navigateToRoom(party.roomId)} style={styles.quickItem}>
                      <span style={styles.quickIcon}>📅</span>
                      <span style={styles.quickName}>{party.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {recentRooms.length > 0 && (
              <div style={styles.quickSection}>
                <h3 style={styles.quickTitle}>Recent Rooms</h3>
                <div style={styles.quickList}>
                  {recentRooms.map((room) => (
                    <button
                      key={room.roomId}
                      onClick={() => navigateToRoom(room.roomId)}
                      style={styles.quickItem}
                      data-testid={`recent-room-${room.roomId}`}
                    >
                      <span style={styles.quickIcon}>🎥</span>
                      <span style={styles.quickName}>{room.roomName}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {bookmarkedRooms.length > 0 && (
              <div style={styles.quickSection}>
                <h3 style={styles.quickTitle}>Saved Rooms</h3>
                <div style={styles.quickList}>
                  {bookmarkedRooms.map((room) => (
                    <button
                      key={room.roomId}
                      onClick={() => navigateToRoom(room.roomId)}
                      style={styles.quickItem}
                      data-testid={`bookmarked-room-${room.roomId}`}
                    >
                      <span style={styles.quickIcon}>🔖</span>
                      <span style={styles.quickName}>{room.roomName}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer hint */}
        <p style={styles.hint}>Share the room link with friends after creating</p>
      </div>

      {/* Modals */}
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      <UserProfile isOpen={showProfile} onClose={() => setShowProfile(false)} />
      <ThemeSettings isOpen={showTheme} onClose={() => setShowTheme(false)} />
      <FriendsPanel isOpen={showFriends} onClose={() => setShowFriends(false)} />
      <ScheduledParties isOpen={showScheduled} onClose={() => setShowScheduled(false)} />
      <WatchHistory isOpen={showHistory} onClose={() => setShowHistory(false)} />
      <RoomBookmarks isOpen={showBookmarks} onClose={() => setShowBookmarks(false)} onNavigateToRoom={navigateToRoom} />
      <Notifications isOpen={showNotifications} onClose={() => setShowNotifications(false)} />

      {showActivity && <ActivityFeed onClose={() => setShowActivity(false)} />}
      {showPlaylists && <PlaylistsPanel onClose={() => setShowPlaylists(false)} />}
      {showGroups && <GroupsPanel onClose={() => setShowGroups(false)} />}
      {showTemplates && <RoomTemplatesModal onClose={() => setShowTemplates(false)} />}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    position: "fixed",
    top: 0,
    right: 0,
    padding: "1rem",
    zIndex: 100,
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  headerButton: {
    width: "36px",
    height: "36px",
    border: "none",
    background: "#262626",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
  },
  userButton: {
    width: "36px",
    height: "36px",
    border: "none",
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#ffffff",
    background: "#6366f1",
    overflow: "hidden",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatar: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  },
  signInButton: {
    padding: "0.5rem 1rem",
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    border: "none",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "0.875rem",
    fontWeight: 500,
    cursor: "pointer",
  },
  featureButtons: {
    display: "flex",
    justifyContent: "center",
    gap: "0.5rem",
    marginBottom: "1.5rem",
    flexWrap: "wrap" as const,
  },
  featureButton: {
    padding: "0.5rem 0.75rem",
    background: "#262626",
    border: "1px solid #333",
    borderRadius: "100px",
    color: "#a3a3a3",
    fontSize: "0.75rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  card: {
    background: "#1a1a1a",
    borderRadius: "16px",
    padding: "2rem",
    border: "1px solid #333",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
  },
  cardTitle: {
    fontSize: "1.5rem",
    fontWeight: 600,
    margin: "0 0 0.5rem 0",
    color: "#ffffff",
  },
  cardSubtitle: {
    fontSize: "0.875rem",
    color: "#737373",
    margin: "0 0 1.5rem 0",
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "1.25rem",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.5rem",
  },
  label: {
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#a3a3a3",
  },
  input: {
    width: "100%",
    padding: "0.875rem 1rem",
    fontSize: "1rem",
    background: "#262626",
    border: "1px solid #404040",
    borderRadius: "10px",
    color: "#ffffff",
    outline: "none",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  },
  buttonGroup: {
    display: "flex",
    gap: "0.75rem",
    marginTop: "0.5rem",
  },
  primaryButton: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "0.875rem 1.5rem",
    fontSize: "1rem",
    fontWeight: 600,
    color: "#ffffff",
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  secondaryButton: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "0.875rem 1.5rem",
    fontSize: "1rem",
    fontWeight: 600,
    color: "#ffffff",
    background: "transparent",
    border: "1px solid #404040",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "border-color 0.2s ease, background 0.2s ease",
  },
  loadingText: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  quickAccess: {
    marginTop: "1.5rem",
    display: "flex",
    flexDirection: "column" as const,
    gap: "1rem",
  },
  quickSection: {
    background: "#1a1a1a",
    borderRadius: "12px",
    padding: "1rem",
    border: "1px solid #333",
  },
  quickTitle: {
    margin: "0 0 0.75rem 0",
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#a3a3a3",
  },
  quickList: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap" as const,
  },
  quickItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 0.75rem",
    background: "#262626",
    border: "none",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "0.75rem",
    cursor: "pointer",
    transition: "background 0.2s ease",
  },
  quickIcon: {
    fontSize: "0.875rem",
  },
  quickName: {
    maxWidth: "120px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  hint: {
    textAlign: "center" as const,
    fontSize: "0.875rem",
    color: "#737373",
    marginTop: "1.5rem",
  },
  templateButton: {
    width: "100%",
    padding: "0.75rem",
    marginTop: "0.5rem",
    background: "transparent",
    border: "1px dashed #404040",
    borderRadius: "10px",
    color: "#a3a3a3",
    fontSize: "0.875rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  adminLinkContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "1rem",
  },
  adminLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 1rem",
    background: "rgba(139, 92, 246, 0.1)",
    border: "1px solid rgba(139, 92, 246, 0.3)",
    borderRadius: "100px",
    color: "#8B5CF6",
    fontSize: "0.75rem",
    textDecoration: "none",
    transition: "all 0.2s ease",
  },
  whatsNewLinkContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "1rem",
  },
  whatsNewLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 1rem",
    background: "rgba(59, 130, 246, 0.1)",
    border: "1px solid rgba(59, 130, 246, 0.3)",
    borderRadius: "100px",
    color: "#3B82F6",
    fontSize: "0.75rem",
    textDecoration: "none",
    transition: "all 0.2s ease",
  },
};
