import { useState, FormEvent, ChangeEvent, useEffect, useRef } from "react";
import { useSnackbar } from "notistack";

interface Video {
  videoId: string;
  url: string;
  name: string;
  channel?: string;
  description?: string;
  img?: string;
}

interface AddVideoBarProps {
  addVideoToList: (video: Video) => void;
}

// Extract YouTube video ID from URL
const getYouTubeId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

export const AddVideoBar = ({ addVideoToList }: AddVideoBarProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 600);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Perform search when debounced query changes
  useEffect(() => {
    const searchVideos = async () => {
      if (debouncedQuery.length < 3) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      // Check if it's a YouTube URL - if so, don't search
      const videoId = getYouTubeId(debouncedQuery);
      if (videoId) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/youtube?q=${encodeURIComponent(debouncedQuery)}`);
        const data = await response.json();
        setSearchResults(data);
        setShowResults(true);
      } catch (error) {
        console.error("Search error:", error);
        enqueueSnackbar("Failed to search videos", { variant: "error" });
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    searchVideos();
  }, [debouncedQuery, enqueueSnackbar]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const videoId = getYouTubeId(searchQuery);
    if (!videoId) {
      enqueueSnackbar("Please search for a video or paste a valid YouTube URL", {
        variant: "warning",
      });
      return;
    }

    const video: Video = {
      videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      name: `Video ${videoId}`,
      description: "YouTube video",
      img: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    };

    addVideoToList(video);
    setSearchQuery("");
    setShowResults(false);
  };

  const handleSelectVideo = (video: Video) => {
    addVideoToList(video);
    setSearchQuery("");
    setShowResults(false);
    setSearchResults([]);
  };

  return (
    <div ref={containerRef} style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={{
          ...styles.inputWrapper,
          borderColor: isFocused ? "#6366f1" : "#333",
          boxShadow: isFocused ? "0 0 0 3px rgba(99, 102, 241, 0.1)" : "none",
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={styles.searchIcon}>
            <path
              d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z"
              stroke="#737373"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M19 19L14.65 14.65"
              stroke="#737373"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search YouTube or paste video URL..."
            style={styles.input}
          />
          {isSearching && (
            <div style={styles.loader}>
              <div style={styles.loaderSpinner} />
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={!searchQuery.trim()}
          style={{
            ...styles.addButton,
            opacity: !searchQuery.trim() ? 0.5 : 1,
            cursor: !searchQuery.trim() ? "not-allowed" : "pointer",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Add
        </button>
      </form>

      {/* Search Results Dropdown */}
      {showResults && (
        <div style={styles.dropdown}>
          {searchResults.length > 0 ? (
            <div style={styles.resultsList}>
              {searchResults.map((video) => (
                <button
                  key={video.videoId}
                  onClick={() => handleSelectVideo(video)}
                  style={styles.resultItem}
                  type="button"
                >
                  <img
                    src={video.img}
                    alt={video.name}
                    style={styles.resultThumbnail}
                  />
                  <div style={styles.resultInfo}>
                    <span style={styles.resultTitle}>{video.name}</span>
                    <span style={styles.resultDescription}>
                      {video.description?.slice(0, 80)}
                      {(video.description?.length ?? 0) > 80 ? "..." : ""}
                    </span>
                  </div>
                  <div style={styles.addIconWrapper}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div style={styles.noResults}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                  stroke="#737373"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>No videos found</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "relative",
    marginBottom: "1.5rem",
  },
  form: {
    display: "flex",
    gap: "0.75rem",
  },
  inputWrapper: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0 1rem",
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "12px",
    transition: "all 0.2s ease",
  },
  searchIcon: {
    flexShrink: 0,
  },
  input: {
    flex: 1,
    padding: "0.875rem 0",
    fontSize: "0.9375rem",
    background: "transparent",
    border: "none",
    color: "#ffffff",
    outline: "none",
  },
  loader: {
    flexShrink: 0,
  },
  loaderSpinner: {
    width: "18px",
    height: "18px",
    border: "2px solid #333",
    borderTopColor: "#6366f1",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  addButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0 1.25rem",
    fontSize: "0.9375rem",
    fontWeight: 600,
    color: "#ffffff",
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
  },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 8px)",
    left: 0,
    right: 0,
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "12px",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
    maxHeight: "400px",
    overflow: "hidden",
    zIndex: 1000,
    animation: "fadeIn 0.2s ease-out",
  },
  resultsList: {
    maxHeight: "400px",
    overflowY: "auto",
  },
  resultItem: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "0.875rem 1rem",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid #262626",
    cursor: "pointer",
    textAlign: "left" as const,
    transition: "background 0.15s ease",
  },
  resultThumbnail: {
    width: "120px",
    height: "68px",
    borderRadius: "8px",
    objectFit: "cover" as const,
    flexShrink: 0,
  },
  resultInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.25rem",
    minWidth: 0,
  },
  resultTitle: {
    fontSize: "0.9375rem",
    fontWeight: 500,
    color: "#ffffff",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
    lineHeight: 1.3,
  },
  resultDescription: {
    fontSize: "0.8125rem",
    color: "#737373",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  addIconWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    background: "#262626",
    borderRadius: "8px",
    color: "#a3a3a3",
    flexShrink: 0,
    transition: "all 0.15s ease",
  },
  noResults: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "0.75rem",
    padding: "2rem",
    color: "#737373",
    fontSize: "0.875rem",
  },
};

// Inject keyframes for spinner
const spinnerStyles = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .search-result-item:hover {
    background: #262626 !important;
  }

  .search-result-item:hover .add-icon-wrapper {
    background: #6366f1 !important;
    color: #ffffff !important;
  }
`;

if (typeof document !== "undefined") {
  const styleEl = document.createElement("style");
  styleEl.textContent = spinnerStyles;
  document.head.appendChild(styleEl);
}
