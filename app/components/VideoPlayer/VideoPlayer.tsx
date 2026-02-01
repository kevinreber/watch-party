import { useRef, useEffect } from "react";
import ReactPlayer from "react-player/youtube";
import type { OnProgressProps } from "react-player/base";

interface Video {
  videoId: string;
  url: string;
  name: string;
  channel?: string;
  description?: string;
  img?: string;
}

interface VideoPlayerProps {
  curVideo: Video | undefined;
  isPlaying: boolean;
  currentTime: number;
  isMutedForSync: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onProgress: (state: { playedSeconds: number }) => void;
  onReady: () => void;
  onEnded: () => void;
  onUnmute: () => void;
}

export const VideoPlayer = ({
  curVideo,
  isPlaying,
  currentTime,
  isMutedForSync,
  onPlay,
  onPause,
  onSeek,
  onProgress,
  onReady,
  onEnded,
  onUnmute,
}: VideoPlayerProps) => {
  const playerRef = useRef<ReactPlayer>(null);
  const lastSeekTime = useRef<number>(0);
  const isPlayerReady = useRef<boolean>(false);
  const pendingSeekTime = useRef<number | null>(null);

  // Handle player ready - perform any pending seek
  const handlePlayerReady = () => {
    isPlayerReady.current = true;

    // If we have a pending seek time or an initial currentTime, seek now
    const seekTarget = pendingSeekTime.current ?? (currentTime > 2 ? currentTime : null);
    if (seekTarget !== null && playerRef.current) {
      playerRef.current.seekTo(seekTarget, "seconds");
      lastSeekTime.current = seekTarget;
      pendingSeekTime.current = null;
    }

    onReady();
  };

  // Reset player ready state when video changes
  useEffect(() => {
    isPlayerReady.current = false;
    pendingSeekTime.current = null;
    lastSeekTime.current = 0;
  }, [curVideo?.videoId]);

  // Seek to time when currentTime changes significantly (sync event)
  useEffect(() => {
    // If player isn't ready yet, store the seek time for later
    if (!isPlayerReady.current) {
      if (currentTime > 2) {
        pendingSeekTime.current = currentTime;
      }

      return;
    }

    if (playerRef.current && Math.abs(currentTime - lastSeekTime.current) > 2) {
      playerRef.current.seekTo(currentTime, "seconds");
      lastSeekTime.current = currentTime;
    }
  }, [currentTime]);

  const handleProgress = (state: OnProgressProps) => {
    lastSeekTime.current = state.playedSeconds;
    onProgress({ playedSeconds: state.playedSeconds });
  };

  const handleSeek = (seconds: number) => {
    onSeek(seconds);
  };

  if (!curVideo) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyContent}>
          <div style={styles.emptyIcon}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <rect width="64" height="64" rx="16" fill="#1a1a1a" />
              <path
                d="M26 22L42 32L26 42V22Z"
                fill="#333"
                stroke="#404040"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3 style={styles.emptyTitle}>No video playing</h3>
          <p style={styles.emptyText}>
            Search for a YouTube video or paste a URL above to start watching together
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.playerWrapper}>
        <ReactPlayer
          ref={playerRef}
          url={curVideo.url}
          width="100%"
          height="100%"
          playing={isPlaying}
          muted={isMutedForSync}
          controls
          onPlay={onPlay}
          onPause={onPause}
          onProgress={handleProgress}
          onReady={handlePlayerReady}
          onEnded={onEnded}
          onSeek={handleSeek}
          progressInterval={1000}
          config={{
            playerVars: {
              modestbranding: 1,
              rel: 0,
              showinfo: 0,
            },
          }}
        />
      </div>
      {/* Sync indicator */}
      <div style={styles.syncIndicator}>
        <span style={styles.syncDot} />
        <span style={styles.syncText}>Synced</span>
      </div>
      {/* Unmute indicator - shown when video is muted for sync */}
      {isMutedForSync && (
        <button
          onClick={onUnmute}
          style={styles.unmuteButton}
          aria-label="Click to unmute"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
          <span>Click to unmute</span>
        </button>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "relative",
    width: "100%",
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    borderRadius: "16px",
    overflow: "hidden",
    background: "#000",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
  },
  playerWrapper: {
    position: "relative",
    flex: 1,
    minHeight: 0,
  },
  emptyState: {
    width: "100%",
    flex: 1,
    minHeight: "200px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)",
    borderRadius: "16px",
    border: "1px solid #262626",
  },
  emptyContent: {
    textAlign: "center" as const,
    padding: "2rem",
    maxWidth: "400px",
  },
  emptyIcon: {
    marginBottom: "1.5rem",
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: "1.25rem",
    fontWeight: 600,
    color: "#ffffff",
    margin: "0 0 0.5rem 0",
  },
  emptyText: {
    fontSize: "0.875rem",
    color: "#737373",
    margin: 0,
    lineHeight: 1.5,
  },
  syncIndicator: {
    position: "absolute",
    top: "12px",
    right: "12px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    background: "rgba(0, 0, 0, 0.7)",
    backdropFilter: "blur(8px)",
    borderRadius: "100px",
    zIndex: 10,
  },
  syncDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#22c55e",
    boxShadow: "0 0 8px rgba(34, 197, 94, 0.5)",
  },
  syncText: {
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "#ffffff",
  },
  unmuteButton: {
    position: "absolute",
    bottom: "80px",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 20px",
    background: "rgba(239, 68, 68, 0.9)",
    backdropFilter: "blur(8px)",
    border: "none",
    borderRadius: "100px",
    color: "#ffffff",
    fontSize: "0.875rem",
    fontWeight: 500,
    cursor: "pointer",
    zIndex: 20,
    transition: "background 0.2s ease",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
  },
};

// Inject styles for ReactPlayer positioning
const playerStyles = `
  .react-player {
    position: absolute !important;
    top: 0;
    left: 0;
    width: 100% !important;
    height: 100% !important;
  }
`;

if (typeof document !== "undefined") {
  const styleEl = document.createElement("style");
  styleEl.textContent = playerStyles;
  document.head.appendChild(styleEl);
}
