import { useContext, useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { UserContext } from "~/context/UserContext";
import {
  useAbly,
  useHandleVideoListAbly,
  useGetUserCountAbly,
  useLoadYouTubeScript,
} from "~/hooks";
import { useVideoSyncAbly } from "~/hooks/useVideoSyncAbly";
import {
  VideoPlayer,
  AddVideoBar,
  SidePanel,
  EmojiReactions,
  Poll,
  RoomSettings,
} from "~/components";
import { historyService } from "~/services/historyService";

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [copied, setCopied] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [hasActivePoll, setHasActivePoll] = useState(false);
  const hasAutoShownPoll = useRef(false);

  // Ably connection and channel
  const { channel, isConnected, clientId } = useAbly(user);
  const { usersCount } = useGetUserCountAbly(channel);
  const { videos, addVideoToList, removeVideoFromList, playNextVideo } = useHandleVideoListAbly(channel, clientId);

  // Video sync state
  const {
    isPlaying,
    currentTime,
    isMutedForSync,
    handlePlay,
    handlePause,
    handleSeek,
    handleProgress,
    handleReady,
    handleUnmute,
  } = useVideoSyncAbly(channel, roomId, clientId);

  useLoadYouTubeScript();

  // Track room visit on mount
  useEffect(() => {
    if (roomId) {
      historyService.addRoomVisit(roomId, roomId);
      setIsBookmarked(historyService.isRoomBookmarked(roomId));
    }
  }, [roomId]);

  // Track watch time and video
  useEffect(() => {
    if (!roomId || !videos[0]) return;

    // Add to watch history when video changes
    historyService.addToWatchHistory({
      videoId: videos[0].videoId,
      videoName: videos[0].name,
      videoChannel: videos[0].channel,
      videoImg: videos[0].img,
      watchDuration: 0,
      roomId,
      roomName: roomId,
    });
  }, [videos, roomId]);

  const handleVideoEnd = useCallback(() => {
    playNextVideo();
  }, [playNextVideo]);

  // Handle poll availability - auto-show poll section for late joiners
  const handlePollAvailable = useCallback((isAvailable: boolean) => {
    setHasActivePoll(isAvailable);
    // Auto-show poll section when a poll is synced to a late joiner
    if (isAvailable && !showPoll && !hasAutoShownPoll.current) {
      hasAutoShownPoll.current = true;
      setShowPoll(true);
    }
  }, [showPoll]);

  const copyRoomLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleBookmark = () => {
    if (!roomId) return;
    if (isBookmarked) {
      historyService.removeRoomBookmark(roomId);
    } else {
      historyService.addRoomBookmark(roomId, roomId);
    }
    setIsBookmarked(!isBookmarked);
  };

  const handleFavoriteVideo = () => {
    if (videos[0]) {
      historyService.addFavoriteVideo(videos[0]);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button onClick={() => navigate("/")} style={styles.backButton} data-testid="back-button">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div style={styles.logoContainer}>
            <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="10" fill="url(#headerGradient)" />
              <path d="M18 16L34 24L18 32V16Z" fill="white" />
              <defs>
                <linearGradient id="headerGradient" x1="0" y1="0" x2="48" y2="48">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <span style={styles.logoText}>Watch Party</span>
          </div>
        </div>

        <div style={styles.roomInfo}>
          <div style={styles.roomBadge}>
            <span style={styles.roomLabel}>Room</span>
            <span style={styles.roomName}>{roomId}</span>
          </div>
          <button onClick={copyRoomLink} style={styles.shareButton} data-testid="share-button">
            {copied ? (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8L6 11L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 2H12C13.1046 2 14 2.89543 14 4V12C14 13.1046 13.1046 14 12 14H4C2.89543 14 2 13.1046 2 12V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <rect x="2" y="2" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                Share Link
              </>
            )}
          </button>
          <button
            onClick={toggleBookmark}
            style={{
              ...styles.iconButton,
              color: isBookmarked ? "#f59e0b" : "#a3a3a3",
            }}
            title={isBookmarked ? "Remove bookmark" : "Bookmark room"}
            data-testid="bookmark-button"
          >
            {isBookmarked ? "★" : "☆"}
          </button>
          <button
            onClick={() => setShowSettings(true)}
            style={styles.iconButton}
            title="Room settings"
            data-testid="room-settings-button"
          >
            ⚙️
          </button>
        </div>

        <div style={styles.headerRight}>
          <button
            onClick={() => setShowPoll(!showPoll)}
            style={{
              ...styles.pollButton,
              ...(hasActivePoll && !showPoll ? styles.pollButtonActive : {}),
            }}
            data-testid="poll-button"
          >
            📊 Poll
            {hasActivePoll && !showPoll && (
              <span style={styles.pollBadge}>!</span>
            )}
          </button>
          <div style={styles.connectionStatus}>
            <span style={{
              ...styles.statusDot,
              backgroundColor: isConnected ? "#22c55e" : "#ef4444",
            }} />
            <span style={styles.statusText}>
              {isConnected ? "Connected" : "Connecting..."}
            </span>
          </div>
          <div style={styles.userBadge}>
            <div style={styles.userAvatar}>
              {user.charAt(0).toUpperCase()}
            </div>
            <span style={styles.userName}>{user}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Video Section */}
        <div style={styles.videoSection}>
          <AddVideoBar addVideoToList={addVideoToList} />
          <div style={styles.videoContainer}>
            <VideoPlayer
              curVideo={videos[0]}
              isPlaying={isPlaying}
              currentTime={currentTime}
              isMutedForSync={isMutedForSync}
              onPlay={handlePlay}
              onPause={handlePause}
              onSeek={handleSeek}
              onProgress={handleProgress}
              onReady={handleReady}
              onEnded={handleVideoEnd}
              onUnmute={handleUnmute}
            />
            {/* Emoji Reactions Overlay */}
            <EmojiReactions channel={channel} roomId={roomId} username={user} clientId={clientId} />
          </div>
          {videos[0] && (
            <div style={styles.nowPlaying}>
              <div style={styles.nowPlayingHeader}>
                <div>
                  <span style={styles.nowPlayingLabel}>Now Playing</span>
                  <h3 style={styles.nowPlayingTitle}>{videos[0].name}</h3>
                  {videos[0].channel && (
                    <p style={styles.nowPlayingChannel}>{videos[0].channel}</p>
                  )}
                </div>
                <button
                  onClick={handleFavoriteVideo}
                  style={styles.favoriteButton}
                  title="Add to favorites"
                  data-testid="favorite-button"
                >
                  ❤️
                </button>
              </div>
            </div>
          )}

          {/* Poll Section - always rendered for sync, conditionally visible */}
          {roomId && (
            <div style={{
              ...styles.pollSection,
              display: showPoll ? "block" : "none",
            }}>
              <Poll
                channel={channel}
                roomId={roomId}
                username={user}
                clientId={clientId}
                onPollAvailable={handlePollAvailable}
              />
            </div>
          )}
        </div>

        {/* Side Panel */}
        <SidePanel
          videos={videos}
          removeVideoFromList={removeVideoFromList}
          channel={channel}
          clientId={clientId}
          usersCount={usersCount}
          user={user}
        />
      </main>

      {/* Room Settings Modal */}
      {roomId && (
        <RoomSettings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          roomId={roomId}
        />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#0f0f0f",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.75rem 1.5rem",
    background: "#1a1a1a",
    borderBottom: "1px solid #262626",
    gap: "1rem",
    flexWrap: "wrap",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  backButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    background: "transparent",
    border: "1px solid #333",
    borderRadius: "8px",
    color: "#a3a3a3",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  logoText: {
    fontSize: "1.125rem",
    fontWeight: 600,
    color: "#ffffff",
  },
  roomInfo: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  roomBadge: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 0.75rem",
    background: "#262626",
    borderRadius: "8px",
  },
  roomLabel: {
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "#737373",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  roomName: {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#ffffff",
  },
  shareButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 0.875rem",
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#ffffff",
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  iconButton: {
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#262626",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  pollButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 0.75rem",
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "#ffffff",
    background: "#262626",
    border: "1px solid #333",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    position: "relative" as const,
  },
  pollButtonActive: {
    border: "1px solid #6366f1",
    background: "rgba(99, 102, 241, 0.1)",
  },
  pollBadge: {
    position: "absolute" as const,
    top: "-4px",
    right: "-4px",
    width: "16px",
    height: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#ef4444",
    borderRadius: "50%",
    fontSize: "0.65rem",
    fontWeight: 700,
    color: "#ffffff",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  connectionStatus: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
  },
  statusText: {
    fontSize: "0.75rem",
    color: "#a3a3a3",
  },
  userBadge: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.375rem 0.75rem 0.375rem 0.375rem",
    background: "#262626",
    borderRadius: "100px",
  },
  userAvatar: {
    width: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    borderRadius: "50%",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#ffffff",
  },
  userName: {
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#ffffff",
  },
  main: {
    flex: 1,
    display: "grid",
    gridTemplateColumns: "1fr 380px",
    gap: "0",
    height: "calc(100vh - 65px)",
    overflow: "hidden",
  },
  videoSection: {
    display: "flex",
    flexDirection: "column",
    padding: "1.5rem",
    overflow: "auto",
  },
  videoContainer: {
    position: "relative",
  },
  nowPlaying: {
    marginTop: "1rem",
    padding: "1rem",
    background: "#1a1a1a",
    borderRadius: "12px",
    border: "1px solid #262626",
  },
  nowPlayingHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  nowPlayingLabel: {
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "#6366f1",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  nowPlayingTitle: {
    fontSize: "1.125rem",
    fontWeight: 600,
    color: "#ffffff",
    margin: "0.25rem 0",
    lineHeight: 1.3,
  },
  nowPlayingChannel: {
    fontSize: "0.875rem",
    color: "#a3a3a3",
    margin: 0,
  },
  favoriteButton: {
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#262626",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  pollSection: {
    marginTop: "1rem",
    background: "#1a1a1a",
    borderRadius: "12px",
    border: "1px solid #262626",
  },
};

// Add media query styles via CSS module or style tag
const mediaQueryStyles = `
  @media (max-width: 1024px) {
    .room-main {
      grid-template-columns: 1fr !important;
      grid-template-rows: auto 1fr !important;
    }
  }
`;

// Inject media query styles
if (typeof document !== "undefined") {
  const styleEl = document.createElement("style");
  styleEl.textContent = mediaQueryStyles;
  document.head.appendChild(styleEl);
}
