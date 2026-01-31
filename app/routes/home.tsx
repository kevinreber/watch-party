import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router";
import { useUser, useClerk } from "@clerk/clerk-react";

import { UserContext } from "~/context/UserContext";
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

  // Load quick access data
  useEffect(() => {
    setRecentRooms(historyService.getRoomHistory().slice(0, 3));
    setBookmarkedRooms(historyService.getRoomBookmarks().slice(0, 3));
    setUpcomingParties(scheduledPartyService.getUpcomingParties().slice(0, 2));
  }, []);

  // Sync user name with Clerk user if signed in
  useEffect(() => {
    if (clerkUser) {
      const displayName = clerkUser.username || clerkUser.firstName || clerkUser.emailAddresses[0]?.emailAddress?.split("@")[0] || "User";
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

  return (
    <div style={styles.container}>
      {/* Background decoration */}
      <div style={styles.backgroundGlow} />

      {/* Header with user actions */}
      <div style={styles.header}>
        <div style={styles.headerActions}>
          <NotificationBell onClick={() => setShowNotifications(true)} />
          <button onClick={() => setShowTheme(true)} style={styles.headerButton} data-testid="theme-button">
            ⚙️
          </button>
          {isSignedIn ? (
            <button
              onClick={() => openUserProfile()}
              style={styles.userButton}
              data-testid="profile-button"
            >
              {clerkUser?.imageUrl ? (
                <img
                  src={clerkUser.imageUrl}
                  alt={clerkUser.firstName || "User"}
                  style={styles.userAvatar}
                />
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

      {/* Main content */}
      <div style={styles.content}>
        {/* Logo/Brand */}
        <div style={styles.brandSection}>
          <div style={styles.logoContainer}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={styles.logo}>
              <rect width="48" height="48" rx="12" fill="url(#gradient)" />
              <path d="M18 16L34 24L18 32V16Z" fill="white" />
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="48" y2="48">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <h1 style={styles.brandName}>Watch Party</h1>
          </div>
          <p style={styles.tagline}>
            Watch YouTube videos together with friends in perfect sync
          </p>
        </div>

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

        {/* Features */}
        <div style={styles.features}>
          <div style={styles.feature}>
            <span style={styles.featureIcon}>🎬</span>
            <span style={styles.featureText}>Synchronized playback</span>
          </div>
          <div style={styles.feature}>
            <span style={styles.featureIcon}>💬</span>
            <span style={styles.featureText}>Real-time chat</span>
          </div>
          <div style={styles.feature}>
            <span style={styles.featureIcon}>🎉</span>
            <span style={styles.featureText}>Emoji reactions</span>
          </div>
        </div>

        {/* Form Card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Start a Watch Party</h2>
          <p style={styles.cardSubtitle}>
            Create a room and invite your friends to watch together
          </p>

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
                  <path d="M4 4V7M4 7H7M4 7L7 4.5C8.5 3 10.5 2.5 12.5 3C14.5 3.5 16 5 16.5 7M16 16V13M16 13H13M16 13L13 15.5C11.5 17 9.5 17.5 7.5 17C5.5 16.5 4 15 3.5 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
            {/* Upcoming Parties */}
            {upcomingParties.length > 0 && (
              <div style={styles.quickSection}>
                <h3 style={styles.quickTitle}>Upcoming Parties</h3>
                <div style={styles.quickList}>
                  {upcomingParties.map(party => (
                    <button
                      key={party.id}
                      onClick={() => navigateToRoom(party.roomId)}
                      style={styles.quickItem}
                    >
                      <span style={styles.quickIcon}>📅</span>
                      <span style={styles.quickName}>{party.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Rooms */}
            {recentRooms.length > 0 && (
              <div style={styles.quickSection}>
                <h3 style={styles.quickTitle}>Recent Rooms</h3>
                <div style={styles.quickList}>
                  {recentRooms.map(room => (
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

            {/* Bookmarked Rooms */}
            {bookmarkedRooms.length > 0 && (
              <div style={styles.quickSection}>
                <h3 style={styles.quickTitle}>Saved Rooms</h3>
                <div style={styles.quickList}>
                  {bookmarkedRooms.map(room => (
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
        <p style={styles.hint}>
          Share the room link with friends after creating
        </p>
      </div>

      {/* Modals */}
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      <UserProfile isOpen={showProfile} onClose={() => setShowProfile(false)} />
      <ThemeSettings isOpen={showTheme} onClose={() => setShowTheme(false)} />
      <FriendsPanel isOpen={showFriends} onClose={() => setShowFriends(false)} />
      <ScheduledParties isOpen={showScheduled} onClose={() => setShowScheduled(false)} />
      <WatchHistory isOpen={showHistory} onClose={() => setShowHistory(false)} />
      <RoomBookmarks
        isOpen={showBookmarks}
        onClose={() => setShowBookmarks(false)}
        onNavigateToRoom={navigateToRoom}
      />
      <Notifications isOpen={showNotifications} onClose={() => setShowNotifications(false)} />

      {/* New Social & Engagement Modals */}
      {showActivity && <ActivityFeed onClose={() => setShowActivity(false)} />}
      {showPlaylists && <PlaylistsPanel onClose={() => setShowPlaylists(false)} />}
      {showGroups && <GroupsPanel onClose={() => setShowGroups(false)} />}
      {showTemplates && <RoomTemplatesModal onClose={() => setShowTemplates(false)} />}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
    position: "relative",
    overflow: "hidden",
  },
  backgroundGlow: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "800px",
    height: "800px",
    background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
    pointerEvents: "none",
  },
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
  content: {
    width: "100%",
    maxWidth: "480px",
    position: "relative",
    zIndex: 1,
    animation: "fadeIn 0.5s ease-out",
  },
  brandSection: {
    textAlign: "center" as const,
    marginBottom: "1.5rem",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
    marginBottom: "1rem",
  },
  logo: {
    filter: "drop-shadow(0 4px 12px rgba(99, 102, 241, 0.4))",
  },
  brandName: {
    fontSize: "2rem",
    fontWeight: 700,
    margin: 0,
    background: "linear-gradient(135deg, #ffffff 0%, #a3a3a3 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  tagline: {
    color: "#a3a3a3",
    fontSize: "1rem",
    margin: 0,
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
  features: {
    display: "flex",
    justifyContent: "center",
    gap: "1rem",
    marginBottom: "1.5rem",
    flexWrap: "wrap" as const,
  },
  feature: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 1rem",
    background: "rgba(255, 255, 255, 0.05)",
    borderRadius: "100px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  featureIcon: {
    fontSize: "1rem",
  },
  featureText: {
    fontSize: "0.875rem",
    color: "#a3a3a3",
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
};
