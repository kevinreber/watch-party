import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface ModerationPanelProps {
  roomId: Id<"rooms">;
  onClose: () => void;
}

type MemberRole = "viewer" | "cohost" | "moderator";

export const ModerationPanel = ({ roomId, onClose }: ModerationPanelProps) => {
  const [activeTab, setActiveTab] = useState<"members" | "bans">("members");
  const [banDuration, setBanDuration] = useState<number | null>(null);
  const [muteDuration, setMuteDuration] = useState<number | null>(5);
  const [banReason, setBanReason] = useState("");

  const members = useQuery(api.moderation.getRoomMembers, { roomId });
  const bans = useQuery(api.moderation.getRoomBans, { roomId });

  const setMemberRole = useMutation(api.moderation.setMemberRole);
  const kickUser = useMutation(api.moderation.kickUser);
  const banUser = useMutation(api.moderation.banUser);
  const unbanUser = useMutation(api.moderation.unbanUser);
  const muteUser = useMutation(api.moderation.muteUser);
  const unmuteUser = useMutation(api.moderation.unmuteUser);

  const [selectedUser, setSelectedUser] = useState<Id<"users"> | null>(null);
  const [actionType, setActionType] = useState<"kick" | "ban" | "mute" | "role" | null>(null);

  const handleKick = async (userId: Id<"users">) => {
    try {
      await kickUser({ roomId, userId });
      setSelectedUser(null);
      setActionType(null);
    } catch (error) {
      console.error("Failed to kick user:", error);
    }
  };

  const handleBan = async (userId: Id<"users">) => {
    try {
      await banUser({
        roomId,
        userId,
        reason: banReason || undefined,
        durationMinutes: banDuration || undefined,
      });
      setSelectedUser(null);
      setActionType(null);
      setBanReason("");
    } catch (error) {
      console.error("Failed to ban user:", error);
    }
  };

  const handleUnban = async (userId: Id<"users">) => {
    try {
      await unbanUser({ roomId, userId });
    } catch (error) {
      console.error("Failed to unban user:", error);
    }
  };

  const handleMute = async (userId: Id<"users">) => {
    try {
      await muteUser({
        roomId,
        userId,
        durationMinutes: muteDuration || undefined,
      });
      setSelectedUser(null);
      setActionType(null);
    } catch (error) {
      console.error("Failed to mute user:", error);
    }
  };

  const handleUnmute = async (userId: Id<"users">) => {
    try {
      await unmuteUser({ roomId, userId });
    } catch (error) {
      console.error("Failed to unmute user:", error);
    }
  };

  const handleSetRole = async (userId: Id<"users">, role: MemberRole) => {
    try {
      await setMemberRole({ roomId, userId, role });
      setSelectedUser(null);
      setActionType(null);
    } catch (error) {
      console.error("Failed to set role:", error);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "#F59E0B";
      case "cohost":
        return "#8B5CF6";
      case "moderator":
        return "#3B82F6";
      default:
        return "#888";
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Room Moderation</h2>
          <button onClick={onClose} style={styles.closeButton}>
            &times;
          </button>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            onClick={() => setActiveTab("members")}
            style={{
              ...styles.tab,
              ...(activeTab === "members" ? styles.tabActive : {}),
            }}
          >
            Members ({members?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("bans")}
            style={{
              ...styles.tab,
              ...(activeTab === "bans" ? styles.tabActive : {}),
            }}
          >
            Banned ({bans?.filter((b) => !b.isExpired).length || 0})
          </button>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {activeTab === "members" && (
            <div style={styles.memberList}>
              {members?.map((member) => (
                <div key={member._id} style={styles.memberItem}>
                  <div
                    style={{
                      ...styles.memberAvatar,
                      backgroundColor: member.user?.avatarColor || "#8B5CF6",
                    }}
                  >
                    {member.user?.avatar ? (
                      <img
                        src={member.user.avatar}
                        alt={member.user.username}
                        style={styles.avatarImage}
                      />
                    ) : (
                      member.user?.username?.charAt(0).toUpperCase() || "?"
                    )}
                  </div>
                  <div style={styles.memberInfo}>
                    <span style={styles.memberName}>
                      {member.user?.username || "Unknown"}
                    </span>
                    <span
                      style={{
                        ...styles.memberRole,
                        color: getRoleColor(member.effectiveRole),
                      }}
                    >
                      {member.effectiveRole}
                    </span>
                  </div>
                  {!member.isOwner && (
                    <div style={styles.actionButtons}>
                      <button
                        onClick={() => {
                          setSelectedUser(member.userId);
                          setActionType("role");
                        }}
                        style={styles.actionButton}
                        title="Change role"
                      >
                        👤
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(member.userId);
                          setActionType("mute");
                        }}
                        style={styles.actionButton}
                        title="Mute"
                      >
                        🔇
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(member.userId);
                          setActionType("kick");
                        }}
                        style={styles.actionButton}
                        title="Kick"
                      >
                        👢
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(member.userId);
                          setActionType("ban");
                        }}
                        style={{
                          ...styles.actionButton,
                          ...styles.dangerButton,
                        }}
                        title="Ban"
                      >
                        🚫
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "bans" && (
            <div style={styles.banList}>
              {bans?.filter((b) => !b.isExpired).map((ban) => (
                <div key={ban._id} style={styles.banItem}>
                  <div style={styles.banInfo}>
                    <span style={styles.banName}>
                      {ban.user?.username || "Unknown"}
                    </span>
                    <span style={styles.banMeta}>
                      Banned by {ban.bannedByUser?.username}
                      {ban.reason && ` - "${ban.reason}"`}
                    </span>
                    {ban.expiresAt && (
                      <span style={styles.banExpiry}>
                        Expires: {new Date(ban.expiresAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => ban.userId && handleUnban(ban.userId)}
                    style={styles.unbanButton}
                  >
                    Unban
                  </button>
                </div>
              ))}
              {(!bans || bans.filter((b) => !b.isExpired).length === 0) && (
                <p style={styles.emptyText}>No banned users</p>
              )}
            </div>
          )}
        </div>

        {/* Action Dialogs */}
        {selectedUser && actionType === "kick" && (
          <div style={styles.actionDialog}>
            <h3 style={styles.actionTitle}>Kick User</h3>
            <p style={styles.actionDesc}>
              This will remove the user from the room. They can rejoin.
            </p>
            <div style={styles.actionButtons2}>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setActionType(null);
                }}
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={() => handleKick(selectedUser)}
                style={styles.confirmButton}
              >
                Kick
              </button>
            </div>
          </div>
        )}

        {selectedUser && actionType === "ban" && (
          <div style={styles.actionDialog}>
            <h3 style={styles.actionTitle}>Ban User</h3>
            <input
              type="text"
              placeholder="Reason (optional)"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              style={styles.input}
            />
            <div style={styles.durationOptions}>
              <span style={styles.durationLabel}>Duration:</span>
              {[
                { label: "10 min", value: 10 },
                { label: "1 hour", value: 60 },
                { label: "24 hours", value: 1440 },
                { label: "Permanent", value: null },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setBanDuration(opt.value)}
                  style={{
                    ...styles.durationButton,
                    ...(banDuration === opt.value ? styles.durationActive : {}),
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div style={styles.actionButtons2}>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setActionType(null);
                  setBanReason("");
                }}
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={() => handleBan(selectedUser)}
                style={styles.dangerConfirmButton}
              >
                Ban
              </button>
            </div>
          </div>
        )}

        {selectedUser && actionType === "mute" && (
          <div style={styles.actionDialog}>
            <h3 style={styles.actionTitle}>Mute User</h3>
            <div style={styles.durationOptions}>
              <span style={styles.durationLabel}>Duration:</span>
              {[
                { label: "5 min", value: 5 },
                { label: "15 min", value: 15 },
                { label: "1 hour", value: 60 },
                { label: "Until unmuted", value: null },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setMuteDuration(opt.value)}
                  style={{
                    ...styles.durationButton,
                    ...(muteDuration === opt.value ? styles.durationActive : {}),
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div style={styles.actionButtons2}>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setActionType(null);
                }}
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={() => handleMute(selectedUser)}
                style={styles.confirmButton}
              >
                Mute
              </button>
            </div>
          </div>
        )}

        {selectedUser && actionType === "role" && (
          <div style={styles.actionDialog}>
            <h3 style={styles.actionTitle}>Change Role</h3>
            <div style={styles.roleOptions}>
              {(["viewer", "moderator", "cohost"] as MemberRole[]).map((role) => (
                <button
                  key={role}
                  onClick={() => handleSetRole(selectedUser, role)}
                  style={styles.roleButton}
                >
                  <span style={{ color: getRoleColor(role) }}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setSelectedUser(null);
                setActionType(null);
              }}
              style={styles.cancelButton}
            >
              Cancel
            </button>
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
    flex: 1,
    overflowY: "auto",
    padding: "16px",
  },
  memberList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  memberItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    backgroundColor: "#262626",
    borderRadius: "12px",
  },
  memberAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    fontWeight: "bold",
    color: "#fff",
    overflow: "hidden",
    flexShrink: 0,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  memberInfo: {
    flex: 1,
    minWidth: 0,
  },
  memberName: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#fff",
  },
  memberRole: {
    display: "block",
    fontSize: "12px",
    textTransform: "capitalize",
  },
  actionButtons: {
    display: "flex",
    gap: "4px",
  },
  actionButton: {
    padding: "6px 8px",
    backgroundColor: "#333",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
  },
  dangerButton: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
  },
  banList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  banItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px",
    backgroundColor: "#262626",
    borderRadius: "12px",
  },
  banInfo: {
    flex: 1,
  },
  banName: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#fff",
  },
  banMeta: {
    display: "block",
    fontSize: "12px",
    color: "#888",
    marginTop: "2px",
  },
  banExpiry: {
    display: "block",
    fontSize: "11px",
    color: "#666",
    marginTop: "4px",
  },
  unbanButton: {
    padding: "8px 16px",
    backgroundColor: "#333",
    border: "none",
    borderRadius: "6px",
    color: "#fff",
    cursor: "pointer",
    fontSize: "13px",
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    padding: "40px 20px",
  },
  actionDialog: {
    padding: "20px",
    borderTop: "1px solid #333",
    backgroundColor: "#262626",
  },
  actionTitle: {
    margin: "0 0 12px 0",
    fontSize: "16px",
    fontWeight: "600",
    color: "#fff",
  },
  actionDesc: {
    margin: "0 0 16px 0",
    fontSize: "13px",
    color: "#888",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    backgroundColor: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "14px",
    marginBottom: "12px",
  },
  durationOptions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "16px",
  },
  durationLabel: {
    fontSize: "13px",
    color: "#888",
  },
  durationButton: {
    padding: "6px 12px",
    backgroundColor: "#333",
    border: "none",
    borderRadius: "6px",
    color: "#888",
    cursor: "pointer",
    fontSize: "12px",
  },
  durationActive: {
    backgroundColor: "#8B5CF6",
    color: "#fff",
  },
  roleOptions: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "16px",
  },
  roleButton: {
    padding: "12px",
    backgroundColor: "#333",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    textAlign: "left",
    fontSize: "14px",
  },
  actionButtons2: {
    display: "flex",
    gap: "12px",
  },
  cancelButton: {
    flex: 1,
    padding: "12px",
    backgroundColor: "#333",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
    cursor: "pointer",
  },
  confirmButton: {
    flex: 1,
    padding: "12px",
    backgroundColor: "#8B5CF6",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
    cursor: "pointer",
  },
  dangerConfirmButton: {
    flex: 1,
    padding: "12px",
    backgroundColor: "#EF4444",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
    cursor: "pointer",
  },
};
