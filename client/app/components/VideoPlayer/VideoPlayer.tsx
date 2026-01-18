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
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onProgress: (state: { playedSeconds: number }) => void;
  onReady: () => void;
  onEnded: () => void;
}

export const VideoPlayer = ({
  curVideo,
  isPlaying,
  currentTime,
  onPlay,
  onPause,
  onSeek,
  onProgress,
  onReady,
  onEnded,
}: VideoPlayerProps) => {
  const playerRef = useRef<ReactPlayer>(null);
  const lastSeekTime = useRef<number>(0);

  // Seek to time when currentTime changes significantly (sync event)
  useEffect(() => {
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
          controls
          onPlay={onPlay}
          onPause={onPause}
          onProgress={handleProgress}
          onReady={onReady}
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
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "relative",
    width: "100%",
    borderRadius: "16px",
    overflow: "hidden",
    background: "#000",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
  },
  playerWrapper: {
    position: "relative",
    paddingTop: "56.25%", // 16:9 aspect ratio
  },
  emptyState: {
    width: "100%",
    aspectRatio: "16/9",
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
};

// Inject styles for ReactPlayer positioning
const playerStyles = `
  .react-player {
    position: absolute !important;
    top: 0;
    left: 0;
  }
`;

if (typeof document !== "undefined") {
  const styleEl = document.createElement("style");
  styleEl.textContent = playerStyles;
  document.head.appendChild(styleEl);
}
