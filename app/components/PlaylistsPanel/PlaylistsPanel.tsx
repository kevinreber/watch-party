import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

interface PlaylistsPanelProps {
  onClose: () => void;
  onLoadPlaylist?: (playlistId: Id<"playlists">) => void;
  roomId?: Id<"rooms">;
}

export const PlaylistsPanel = ({ onClose, onLoadPlaylist, roomId }: PlaylistsPanelProps) => {
  const [activeTab, setActiveTab] = useState<"my" | "public">("my");
  const [showCreate, setShowCreate] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDescription, setNewPlaylistDescription] = useState("");
  const [newPlaylistPublic, setNewPlaylistPublic] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Id<"playlists"> | null>(null);

  const myPlaylists = useQuery(api.playlists.getMyPlaylists);
  const publicPlaylists = useQuery(api.playlists.getPublicPlaylists, { limit: 20 });
  const selectedPlaylistDetails = useQuery(
    api.playlists.getPlaylist,
    selectedPlaylist ? { playlistId: selectedPlaylist } : "skip"
  );

  const createPlaylist = useMutation(api.playlists.createPlaylist);
  const deletePlaylist = useMutation(api.playlists.deletePlaylist);
  const loadPlaylistToRoom = useMutation(api.playlists.loadPlaylistToRoom);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    try {
      await createPlaylist({
        name: newPlaylistName,
        description: newPlaylistDescription || undefined,
        isPublic: newPlaylistPublic,
      });
      setNewPlaylistName("");
      setNewPlaylistDescription("");
      setNewPlaylistPublic(false);
      setShowCreate(false);
    } catch (error) {
      console.error("Failed to create playlist:", error);
    }
  };

  const handleDeletePlaylist = async (playlistId: Id<"playlists">) => {
    if (!confirm("Delete this playlist?")) return;
    try {
      await deletePlaylist({ playlistId });
      if (selectedPlaylist === playlistId) {
        setSelectedPlaylist(null);
      }
    } catch (error) {
      console.error("Failed to delete playlist:", error);
    }
  };

  const handleLoadToRoom = async (playlistId: Id<"playlists">) => {
    if (!roomId) {
      onLoadPlaylist?.(playlistId);
      return;
    }
    try {
      await loadPlaylistToRoom({ playlistId, roomId });
      onClose();
    } catch (error) {
      console.error("Failed to load playlist:", error);
    }
  };

  const playlists = activeTab === "my" ? myPlaylists : publicPlaylists;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Playlists</h2>
          <button onClick={onClose} style={styles.closeButton}>
            &times;
          </button>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            onClick={() => setActiveTab("my")}
            style={{
              ...styles.tab,
              ...(activeTab === "my" ? styles.tabActive : {}),
            }}
          >
            My Playlists
          </button>
          <button
            onClick={() => setActiveTab("public")}
            style={{
              ...styles.tab,
              ...(activeTab === "public" ? styles.tabActive : {}),
            }}
          >
            Discover
          </button>
        </div>

        {/* Content */}
        {selectedPlaylist && selectedPlaylistDetails ? (
          <div style={styles.playlistDetail}>
            <button
              onClick={() => setSelectedPlaylist(null)}
              style={styles.backButton}
            >
              ← Back to playlists
            </button>
            <div style={styles.playlistHeader}>
              <div
                style={{
                  ...styles.playlistCover,
                  backgroundImage: selectedPlaylistDetails.coverImage
                    ? `url(${selectedPlaylistDetails.coverImage})`
                    : undefined,
                }}
              >
                {!selectedPlaylistDetails.coverImage && "🎵"}
              </div>
              <div style={styles.playlistInfo}>
                <h3 style={styles.playlistTitle}>{selectedPlaylistDetails.name}</h3>
                {selectedPlaylistDetails.description && (
                  <p style={styles.playlistDescription}>
                    {selectedPlaylistDetails.description}
                  </p>
                )}
                <p style={styles.playlistMeta}>
                  {selectedPlaylistDetails.videoCount} videos
                  {selectedPlaylistDetails.owner && (
                    <> • by {selectedPlaylistDetails.owner.username}</>
                  )}
                </p>
              </div>
            </div>
            {roomId && (
              <button
                onClick={() => handleLoadToRoom(selectedPlaylist)}
                style={styles.loadButton}
              >
                Load to Room
              </button>
            )}
            <div style={styles.videoList}>
              {selectedPlaylistDetails.videos?.map((video, index) => (
                <div key={video._id} style={styles.videoItem}>
                  <span style={styles.videoIndex}>{index + 1}</span>
                  {video.img && (
                    <img src={video.img} alt="" style={styles.videoThumb} />
                  )}
                  <div style={styles.videoInfo}>
                    <span style={styles.videoName}>{video.name}</span>
                    {video.channel && (
                      <span style={styles.videoChannel}>{video.channel}</span>
                    )}
                  </div>
                </div>
              ))}
              {(!selectedPlaylistDetails.videos || selectedPlaylistDetails.videos.length === 0) && (
                <p style={styles.emptyText}>No videos in this playlist</p>
              )}
            </div>
          </div>
        ) : showCreate ? (
          <div style={styles.createForm}>
            <input
              type="text"
              placeholder="Playlist name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              style={styles.input}
              autoFocus
            />
            <textarea
              placeholder="Description (optional)"
              value={newPlaylistDescription}
              onChange={(e) => setNewPlaylistDescription(e.target.value)}
              style={styles.textarea}
            />
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={newPlaylistPublic}
                onChange={(e) => setNewPlaylistPublic(e.target.checked)}
              />
              Make public
            </label>
            <div style={styles.formActions}>
              <button onClick={() => setShowCreate(false)} style={styles.cancelButton}>
                Cancel
              </button>
              <button
                onClick={handleCreatePlaylist}
                style={styles.submitButton}
                disabled={!newPlaylistName.trim()}
              >
                Create
              </button>
            </div>
          </div>
        ) : (
          <div style={styles.content}>
            {activeTab === "my" && (
              <button onClick={() => setShowCreate(true)} style={styles.createButton}>
                + Create Playlist
              </button>
            )}
            <div style={styles.playlistList}>
              {playlists && playlists.length > 0 ? (
                playlists.map((playlist) => (
                  <div
                    key={playlist._id}
                    style={styles.playlistCard}
                    onClick={() => setSelectedPlaylist(playlist._id)}
                  >
                    <div
                      style={{
                        ...styles.playlistCardCover,
                        backgroundImage: playlist.coverImage
                          ? `url(${playlist.coverImage})`
                          : undefined,
                      }}
                    >
                      {!playlist.coverImage && "🎵"}
                    </div>
                    <div style={styles.playlistCardInfo}>
                      <span style={styles.playlistCardName}>{playlist.name}</span>
                      <span style={styles.playlistCardMeta}>
                        {playlist.videoCount} videos
                        {playlist.isPublic && " • Public"}
                      </span>
                    </div>
                    {activeTab === "my" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePlaylist(playlist._id);
                        }}
                        style={styles.deleteButton}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div style={styles.emptyState}>
                  <p style={styles.emptyText}>
                    {activeTab === "my"
                      ? "You haven't created any playlists yet"
                      : "No public playlists available"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  panel: {
    backgroundColor: "#1a1a1a",
    borderRadius: "16px",
    width: "90%",
    maxWidth: "500px",
    maxHeight: "80vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px",
    borderBottom: "1px solid #333",
  },
  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "600",
    color: "#fff",
  },
  closeButton: {
    background: "none",
    border: "none",
    color: "#888",
    fontSize: "28px",
    cursor: "pointer",
    lineHeight: 1,
  },
  tabs: {
    display: "flex",
    borderBottom: "1px solid #333",
  },
  tab: {
    flex: 1,
    padding: "12px",
    backgroundColor: "transparent",
    border: "none",
    color: "#888",
    fontSize: "14px",
    cursor: "pointer",
    borderBottom: "2px solid transparent",
  },
  tabActive: {
    color: "#8B5CF6",
    borderBottomColor: "#8B5CF6",
  },
  content: {
    padding: "16px",
    overflowY: "auto",
    flex: 1,
  },
  createButton: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#8B5CF6",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    marginBottom: "16px",
  },
  playlistList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  playlistCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    backgroundColor: "#262626",
    borderRadius: "12px",
    cursor: "pointer",
  },
  playlistCardCover: {
    width: "48px",
    height: "48px",
    borderRadius: "8px",
    backgroundColor: "#333",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    backgroundSize: "cover",
    backgroundPosition: "center",
    flexShrink: 0,
  },
  playlistCardInfo: {
    flex: 1,
    minWidth: 0,
  },
  playlistCardName: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#fff",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  playlistCardMeta: {
    display: "block",
    fontSize: "12px",
    color: "#888",
    marginTop: "2px",
  },
  deleteButton: {
    background: "none",
    border: "none",
    color: "#666",
    fontSize: "20px",
    cursor: "pointer",
    padding: "4px 8px",
  },
  createForm: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  input: {
    padding: "12px",
    backgroundColor: "#262626",
    border: "1px solid #333",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "14px",
  },
  textarea: {
    padding: "12px",
    backgroundColor: "#262626",
    border: "1px solid #333",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "14px",
    minHeight: "80px",
    resize: "vertical",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#888",
    fontSize: "14px",
  },
  formActions: {
    display: "flex",
    gap: "12px",
    marginTop: "8px",
  },
  cancelButton: {
    flex: 1,
    padding: "12px",
    backgroundColor: "#333",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  submitButton: {
    flex: 1,
    padding: "12px",
    backgroundColor: "#8B5CF6",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  playlistDetail: {
    padding: "16px",
    overflowY: "auto",
    flex: 1,
  },
  backButton: {
    background: "none",
    border: "none",
    color: "#8B5CF6",
    fontSize: "14px",
    cursor: "pointer",
    padding: "0",
    marginBottom: "16px",
  },
  playlistHeader: {
    display: "flex",
    gap: "16px",
    marginBottom: "16px",
  },
  playlistCover: {
    width: "100px",
    height: "100px",
    borderRadius: "12px",
    backgroundColor: "#333",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "32px",
    backgroundSize: "cover",
    backgroundPosition: "center",
    flexShrink: 0,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistTitle: {
    margin: "0 0 8px 0",
    fontSize: "20px",
    fontWeight: "600",
    color: "#fff",
  },
  playlistDescription: {
    margin: "0 0 8px 0",
    fontSize: "13px",
    color: "#888",
  },
  playlistMeta: {
    margin: 0,
    fontSize: "12px",
    color: "#666",
  },
  loadButton: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#22c55e",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    marginBottom: "16px",
  },
  videoList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  videoItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "8px",
    backgroundColor: "#262626",
    borderRadius: "8px",
  },
  videoIndex: {
    width: "24px",
    textAlign: "center",
    fontSize: "12px",
    color: "#666",
  },
  videoThumb: {
    width: "64px",
    height: "36px",
    borderRadius: "4px",
    objectFit: "cover",
  },
  videoInfo: {
    flex: 1,
    minWidth: 0,
  },
  videoName: {
    display: "block",
    fontSize: "13px",
    color: "#fff",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  videoChannel: {
    display: "block",
    fontSize: "11px",
    color: "#666",
    marginTop: "2px",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px 20px",
  },
  emptyText: {
    margin: 0,
    color: "#888",
    fontSize: "14px",
  },
};
