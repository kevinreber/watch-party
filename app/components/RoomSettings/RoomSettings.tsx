import { useState, useEffect, type CSSProperties } from "react";
import type { Room, RoomTheme } from "~/types";
import { roomService } from "~/services/roomService";
import { themeService } from "~/services/themeService";

interface RoomSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  onRoomUpdate?: (room: Room) => void;
}

export function RoomSettings({ isOpen, onClose, roomId, onRoomUpdate }: RoomSettingsProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState("");
  const [maxCapacity, setMaxCapacity] = useState(50);
  const [isPersistent, setIsPersistent] = useState(false);
  const [accentColor, setAccentColor] = useState("#6366f1");
  const [showPassword, setShowPassword] = useState(false);

  const isOwner = roomService.isRoomOwner(roomId);
  const colors = themeService.getAccentColors();

  useEffect(() => {
    if (isOpen) {
      const roomData = roomService.getRoom(roomId);
      if (roomData) {
        setRoom(roomData);
        setIsPrivate(roomData.isPrivate);
        setPassword(roomData.password || "");
        setMaxCapacity(roomData.maxCapacity);
        setIsPersistent(roomData.isPersistent);
        setAccentColor(roomData.theme?.accentColor || "#6366f1");
      }
    }
  }, [isOpen, roomId]);

  const handleSave = () => {
    const updated = roomService.updateRoom(roomId, {
      isPrivate,
      password: isPrivate ? password : undefined,
      maxCapacity,
      isPersistent,
      theme: {
        backgroundColor: "#0f0f0f",
        accentColor,
        chatBackground: "#1a1a1a",
      },
    });

    if (updated && onRoomUpdate) {
      onRoomUpdate(updated);
    }
    onClose();
  };

  const handleMakePersistent = () => {
    roomService.makeRoomPersistent(roomId);
    setIsPersistent(true);
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose} data-testid="room-settings">
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Room Settings</h2>
          <button onClick={onClose} style={styles.closeButton}>✕</button>
        </div>

        <div style={styles.content}>
          {/* Room Info */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Room Info</h3>
            <div style={styles.infoCard}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Room ID</span>
                <span style={styles.infoValue}>{roomId}</span>
              </div>
              {room && (
                <>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Owner</span>
                    <span style={styles.infoValue}>{room.ownerName}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Users</span>
                    <span style={styles.infoValue}>{room.currentUsers} / {room.maxCapacity}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Privacy Settings */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Privacy</h3>
            <div style={styles.settingRow}>
              <div style={styles.settingInfo}>
                <span style={styles.settingLabel}>Private Room</span>
                <span style={styles.settingDesc}>Require password to join</span>
              </div>
              <button
                onClick={() => isOwner && setIsPrivate(!isPrivate)}
                disabled={!isOwner}
                style={{
                  ...styles.toggle,
                  backgroundColor: isPrivate ? "#6366f1" : "#404040",
                  opacity: isOwner ? 1 : 0.5,
                }}
                data-testid="private-toggle"
              >
                <div
                  style={{
                    ...styles.toggleKnob,
                    transform: isPrivate ? "translateX(20px)" : "translateX(0)",
                  }}
                />
              </button>
            </div>

            {isPrivate && (
              <div style={styles.passwordInput}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter room password"
                  style={styles.input}
                  disabled={!isOwner}
                  data-testid="room-password-input"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.showPasswordButton}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            )}
          </div>

          {/* Capacity Setting */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Capacity</h3>
            <div style={styles.settingRow}>
              <span style={styles.settingLabel}>Max Users: {maxCapacity}</span>
              <input
                type="range"
                min="2"
                max="100"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(Number(e.target.value))}
                style={styles.slider}
                disabled={!isOwner}
                data-testid="capacity-slider"
              />
            </div>
          </div>

          {/* Persistence */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Persistence</h3>
            <div style={styles.settingRow}>
              <div style={styles.settingInfo}>
                <span style={styles.settingLabel}>Keep Room</span>
                <span style={styles.settingDesc}>Room stays when everyone leaves</span>
              </div>
              {isPersistent ? (
                <span style={styles.persistentBadge}>Persistent</span>
              ) : (
                <button
                  onClick={handleMakePersistent}
                  disabled={!isOwner}
                  style={{
                    ...styles.persistentButton,
                    opacity: isOwner ? 1 : 0.5,
                  }}
                  data-testid="make-persistent"
                >
                  Enable
                </button>
              )}
            </div>
          </div>

          {/* Room Theme */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Room Theme</h3>
            <div style={styles.colorGrid}>
              {colors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => isOwner && setAccentColor(color.value)}
                  disabled={!isOwner}
                  style={{
                    ...styles.colorOption,
                    backgroundColor: color.value,
                    border: accentColor === color.value ? "3px solid white" : "none",
                    transform: accentColor === color.value ? "scale(1.1)" : "scale(1)",
                    opacity: isOwner ? 1 : 0.5,
                  }}
                  title={color.name}
                  data-testid={`room-color-${color.name}`}
                />
              ))}
            </div>
          </div>

          {!isOwner && (
            <p style={styles.notOwnerText}>
              Only the room owner can change settings
            </p>
          )}
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          <button onClick={onClose} style={styles.cancelButton}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isOwner}
            style={{
              ...styles.saveButton,
              opacity: isOwner ? 1 : 0.5,
            }}
            data-testid="save-room-settings"
          >
            Save Changes
          </button>
        </div>
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
    width: "100%",
    maxWidth: "450px",
    maxHeight: "90vh",
    background: "#1a1a1a",
    borderRadius: "16px",
    border: "1px solid #333",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem 1.5rem",
    borderBottom: "1px solid #333",
  },
  title: {
    margin: 0,
    fontSize: "1.25rem",
    fontWeight: 600,
    color: "#ffffff",
  },
  closeButton: {
    width: "32px",
    height: "32px",
    border: "none",
    background: "#262626",
    borderRadius: "8px",
    color: "#a3a3a3",
    cursor: "pointer",
    fontSize: "1rem",
  },
  content: {
    flex: 1,
    overflowY: "auto",
    padding: "1rem 1.5rem",
  },
  section: {
    marginBottom: "1.5rem",
  },
  sectionTitle: {
    margin: "0 0 0.75rem 0",
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#a3a3a3",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  infoCard: {
    background: "#262626",
    borderRadius: "8px",
    padding: "0.75rem",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "0.5rem 0",
  },
  infoLabel: {
    fontSize: "0.875rem",
    color: "#737373",
  },
  infoValue: {
    fontSize: "0.875rem",
    color: "#ffffff",
    fontWeight: 500,
  },
  settingRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.75rem",
    background: "#262626",
    borderRadius: "8px",
  },
  settingInfo: {
    display: "flex",
    flexDirection: "column",
  },
  settingLabel: {
    fontSize: "0.875rem",
    color: "#ffffff",
    fontWeight: 500,
  },
  settingDesc: {
    fontSize: "0.75rem",
    color: "#737373",
    marginTop: "0.125rem",
  },
  toggle: {
    position: "relative",
    width: "48px",
    height: "28px",
    borderRadius: "14px",
    border: "none",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
  toggleKnob: {
    position: "absolute",
    top: "4px",
    left: "4px",
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: "#ffffff",
    transition: "transform 0.2s ease",
  },
  passwordInput: {
    display: "flex",
    gap: "0.5rem",
    marginTop: "0.75rem",
  },
  input: {
    flex: 1,
    padding: "0.75rem",
    background: "#1a1a1a",
    border: "1px solid #404040",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "0.875rem",
    outline: "none",
  },
  showPasswordButton: {
    padding: "0.75rem",
    background: "#262626",
    border: "1px solid #404040",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
  },
  slider: {
    width: "150px",
    accentColor: "#6366f1",
  },
  persistentBadge: {
    padding: "0.375rem 0.75rem",
    background: "#22c55e",
    borderRadius: "100px",
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "#ffffff",
  },
  persistentButton: {
    padding: "0.375rem 0.75rem",
    background: "#6366f1",
    border: "none",
    borderRadius: "6px",
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "#ffffff",
    cursor: "pointer",
  },
  colorGrid: {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap",
  },
  colorOption: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  notOwnerText: {
    color: "#737373",
    fontSize: "0.75rem",
    fontStyle: "italic",
    textAlign: "center",
  },
  actions: {
    display: "flex",
    gap: "0.75rem",
    padding: "1rem 1.5rem",
    borderTop: "1px solid #333",
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
};
