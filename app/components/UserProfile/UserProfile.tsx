import { useState, type CSSProperties } from "react";
import { useAuth } from "~/context/AuthContext";
import type { Badge } from "~/types";
import { themeService } from "~/services/themeService";

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfile({ isOpen, onClose }: UserProfileProps) {
  const { user, updateProfile, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(user?.username || "");
  const [selectedColor, setSelectedColor] = useState(user?.avatarColor || "#6366f1");
  const [error, setError] = useState("");

  if (!isOpen || !user) return null;

  const colors = themeService.getAccentColors();

  const handleSave = async () => {
    try {
      await updateProfile({
        username: newUsername,
        avatar: newUsername.charAt(0).toUpperCase(),
        avatarColor: selectedColor,
      });
      setIsEditing(false);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    }
  };

  const formatWatchTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getBadgeIcon = (badge: Badge) => {
    return badge.icon;
  };

  return (
    <div style={styles.overlay} onClick={onClose} data-testid="user-profile">
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} style={styles.closeButton}>
          ✕
        </button>

        {/* Profile Header */}
        <div style={styles.header}>
          <div
            style={{
              ...styles.avatar,
              backgroundColor: user.avatarColor,
            }}
            data-testid="user-avatar"
          >
            {user.avatar}
          </div>
          <div style={styles.headerInfo}>
            {isEditing ? (
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                style={styles.nameInput}
                data-testid="username-edit-input"
              />
            ) : (
              <h2 style={styles.username}>{user.username}</h2>
            )}
            <p style={styles.email}>{user.email}</p>
          </div>
        </div>

        {/* Avatar Color Picker (when editing) */}
        {isEditing && (
          <div style={styles.colorPicker}>
            <label style={styles.colorLabel}>Avatar Color</label>
            <div style={styles.colorGrid}>
              {colors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSelectedColor(color.value)}
                  style={{
                    ...styles.colorOption,
                    backgroundColor: color.value,
                    border: selectedColor === color.value ? "2px solid white" : "none",
                  }}
                  title={color.name}
                  data-testid={`color-${color.name}`}
                />
              ))}
            </div>
          </div>
        )}

        {error && <div style={styles.error}>{error}</div>}

        {/* Edit Actions */}
        <div style={styles.editActions}>
          {isEditing ? (
            <>
              <button onClick={() => setIsEditing(false)} style={styles.cancelButton}>
                Cancel
              </button>
              <button onClick={handleSave} style={styles.saveButton} data-testid="save-profile">
                Save Changes
              </button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} style={styles.editButton} data-testid="edit-profile">
              Edit Profile
            </button>
          )}
        </div>

        {/* Stats Section */}
        <div style={styles.statsSection}>
          <h3 style={styles.sectionTitle}>Your Stats</h3>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <span style={styles.statValue}>{formatWatchTime(user.stats.totalWatchTime)}</span>
              <span style={styles.statLabel}>Watch Time</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statValue}>{user.stats.videosWatched}</span>
              <span style={styles.statLabel}>Videos</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statValue}>{user.stats.partiesHosted}</span>
              <span style={styles.statLabel}>Hosted</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statValue}>{user.stats.partiesJoined}</span>
              <span style={styles.statLabel}>Joined</span>
            </div>
          </div>
        </div>

        {/* Badges Section */}
        <div style={styles.badgesSection}>
          <h3 style={styles.sectionTitle}>Badges ({user.badges.length})</h3>
          {user.badges.length > 0 ? (
            <div style={styles.badgesGrid}>
              {user.badges.map((badge) => (
                <div key={badge.id} style={styles.badge} title={badge.description}>
                  <span style={styles.badgeIcon}>{getBadgeIcon(badge)}</span>
                  <span style={styles.badgeName}>{badge.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={styles.noBadges}>
              Keep watching to earn badges!
            </p>
          )}
        </div>

        {/* Logout Button */}
        <button onClick={logout} style={styles.logoutButton} data-testid="logout-button">
          Sign Out
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    position: "relative",
    width: "100%",
    maxWidth: "450px",
    maxHeight: "90vh",
    background: "#1a1a1a",
    borderRadius: "16px",
    padding: "2rem",
    border: "1px solid #333",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
    overflowY: "auto",
  },
  closeButton: {
    position: "absolute",
    top: "1rem",
    right: "1rem",
    width: "32px",
    height: "32px",
    border: "none",
    background: "#262626",
    borderRadius: "8px",
    color: "#a3a3a3",
    cursor: "pointer",
    fontSize: "1rem",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  avatar: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
    fontWeight: 600,
    color: "#ffffff",
  },
  headerInfo: {
    flex: 1,
  },
  username: {
    margin: 0,
    fontSize: "1.25rem",
    fontWeight: 600,
    color: "#ffffff",
  },
  email: {
    margin: "0.25rem 0 0 0",
    fontSize: "0.875rem",
    color: "#a3a3a3",
  },
  nameInput: {
    padding: "0.5rem",
    background: "#262626",
    border: "1px solid #404040",
    borderRadius: "6px",
    color: "#ffffff",
    fontSize: "1rem",
    width: "100%",
  },
  colorPicker: {
    marginBottom: "1rem",
  },
  colorLabel: {
    display: "block",
    fontSize: "0.875rem",
    color: "#a3a3a3",
    marginBottom: "0.5rem",
  },
  colorGrid: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  colorOption: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    cursor: "pointer",
    transition: "transform 0.2s ease",
  },
  error: {
    padding: "0.75rem",
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "8px",
    color: "#ef4444",
    fontSize: "0.875rem",
    marginBottom: "1rem",
  },
  editActions: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "1.5rem",
  },
  editButton: {
    flex: 1,
    padding: "0.75rem",
    background: "#262626",
    border: "1px solid #404040",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "0.875rem",
    cursor: "pointer",
  },
  cancelButton: {
    flex: 1,
    padding: "0.75rem",
    background: "transparent",
    border: "1px solid #404040",
    borderRadius: "8px",
    color: "#a3a3a3",
    fontSize: "0.875rem",
    cursor: "pointer",
  },
  saveButton: {
    flex: 1,
    padding: "0.75rem",
    background: "#6366f1",
    border: "none",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "0.875rem",
    fontWeight: 500,
    cursor: "pointer",
  },
  statsSection: {
    marginBottom: "1.5rem",
  },
  sectionTitle: {
    margin: "0 0 1rem 0",
    fontSize: "1rem",
    fontWeight: 600,
    color: "#ffffff",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "0.75rem",
  },
  statCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "0.75rem",
    background: "#262626",
    borderRadius: "8px",
  },
  statValue: {
    fontSize: "1.25rem",
    fontWeight: 600,
    color: "#6366f1",
  },
  statLabel: {
    fontSize: "0.75rem",
    color: "#a3a3a3",
    marginTop: "0.25rem",
  },
  badgesSection: {
    marginBottom: "1.5rem",
  },
  badgesGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
  },
  badge: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 0.75rem",
    background: "#262626",
    borderRadius: "100px",
    border: "1px solid #404040",
  },
  badgeIcon: {
    fontSize: "1rem",
  },
  badgeName: {
    fontSize: "0.75rem",
    color: "#ffffff",
  },
  noBadges: {
    color: "#737373",
    fontSize: "0.875rem",
    fontStyle: "italic",
  },
  logoutButton: {
    width: "100%",
    padding: "0.75rem",
    background: "transparent",
    border: "1px solid #ef4444",
    borderRadius: "8px",
    color: "#ef4444",
    fontSize: "0.875rem",
    cursor: "pointer",
  },
};
