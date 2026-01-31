import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface GroupsPanelProps {
  onClose: () => void;
}

const AVATAR_COLORS = [
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#EF4444",
  "#6366F1",
  "#14B8A6",
];

export const GroupsPanel = ({ onClose }: GroupsPanelProps) => {
  const [activeTab, setActiveTab] = useState<"my" | "discover" | "invites">("my");
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupPublic, setNewGroupPublic] = useState(true);
  const [newGroupColor, setNewGroupColor] = useState(AVATAR_COLORS[0]);

  const myGroups = useQuery(api.groups.getMyGroups);
  const publicGroups = useQuery(api.groups.getPublicGroups, { limit: 20 });
  const pendingInvites = useQuery(api.groups.getPendingGroupInvites);

  const createGroup = useMutation(api.groups.createGroup);
  const joinGroup = useMutation(api.groups.joinGroup);
  const leaveGroup = useMutation(api.groups.leaveGroup);
  const respondToInvite = useMutation(api.groups.respondToGroupInvite);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      await createGroup({
        name: newGroupName,
        description: newGroupDescription || undefined,
        isPublic: newGroupPublic,
        avatarColor: newGroupColor,
      });
      setNewGroupName("");
      setNewGroupDescription("");
      setShowCreate(false);
    } catch (error) {
      console.error("Failed to create group:", error);
    }
  };

  const handleJoinGroup = async (groupId: Id<"groups">) => {
    try {
      await joinGroup({ groupId });
    } catch (error) {
      console.error("Failed to join group:", error);
    }
  };

  const handleLeaveGroup = async (groupId: Id<"groups">) => {
    if (!confirm("Leave this group?")) return;
    try {
      await leaveGroup({ groupId });
    } catch (error) {
      console.error("Failed to leave group:", error);
    }
  };

  const handleRespondToInvite = async (inviteId: Id<"groupInvites">, accept: boolean) => {
    try {
      await respondToInvite({ inviteId, accept });
    } catch (error) {
      console.error("Failed to respond to invite:", error);
    }
  };

  const myGroupIds = new Set(myGroups?.map((g) => g._id) || []);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Groups</h2>
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
            My Groups
          </button>
          <button
            onClick={() => setActiveTab("discover")}
            style={{
              ...styles.tab,
              ...(activeTab === "discover" ? styles.tabActive : {}),
            }}
          >
            Discover
          </button>
          <button
            onClick={() => setActiveTab("invites")}
            style={{
              ...styles.tab,
              ...(activeTab === "invites" ? styles.tabActive : {}),
            }}
          >
            Invites
            {pendingInvites && pendingInvites.length > 0 && (
              <span style={styles.badge}>{pendingInvites.length}</span>
            )}
          </button>
        </div>

        {/* Content */}
        {showCreate ? (
          <div style={styles.createForm}>
            <input
              type="text"
              placeholder="Group name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              style={styles.input}
              autoFocus
            />
            <textarea
              placeholder="Description (optional)"
              value={newGroupDescription}
              onChange={(e) => setNewGroupDescription(e.target.value)}
              style={styles.textarea}
            />
            <div style={styles.colorPicker}>
              <span style={styles.colorLabel}>Color:</span>
              <div style={styles.colorOptions}>
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewGroupColor(color)}
                    style={{
                      ...styles.colorOption,
                      backgroundColor: color,
                      ...(newGroupColor === color ? styles.colorOptionSelected : {}),
                    }}
                  />
                ))}
              </div>
            </div>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={newGroupPublic}
                onChange={(e) => setNewGroupPublic(e.target.checked)}
              />
              Public group (anyone can join)
            </label>
            <div style={styles.formActions}>
              <button onClick={() => setShowCreate(false)} style={styles.cancelButton}>
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                style={styles.submitButton}
                disabled={!newGroupName.trim()}
              >
                Create
              </button>
            </div>
          </div>
        ) : (
          <div style={styles.content}>
            {activeTab === "my" && (
              <button onClick={() => setShowCreate(true)} style={styles.createButton}>
                + Create Group
              </button>
            )}

            {activeTab === "my" && (
              <div style={styles.groupList}>
                {myGroups && myGroups.length > 0 ? (
                  myGroups.map((group) => (
                    <div key={group._id} style={styles.groupCard}>
                      <div
                        style={{
                          ...styles.groupAvatar,
                          backgroundColor: group.avatarColor,
                        }}
                      >
                        {group.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={styles.groupInfo}>
                        <span style={styles.groupName}>{group.name}</span>
                        <span style={styles.groupMeta}>
                          {group.memberCount} members • {group.myRole}
                        </span>
                      </div>
                      {group.myRole !== "owner" && (
                        <button
                          onClick={() => handleLeaveGroup(group._id)}
                          style={styles.leaveButton}
                        >
                          Leave
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div style={styles.emptyState}>
                    <p style={styles.emptyText}>You haven't joined any groups yet</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "discover" && (
              <div style={styles.groupList}>
                {publicGroups && publicGroups.length > 0 ? (
                  publicGroups
                    .filter((g) => !myGroupIds.has(g._id))
                    .map((group) => (
                      <div key={group._id} style={styles.groupCard}>
                        <div
                          style={{
                            ...styles.groupAvatar,
                            backgroundColor: group.avatarColor,
                          }}
                        >
                          {group.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={styles.groupInfo}>
                          <span style={styles.groupName}>{group.name}</span>
                          <span style={styles.groupMeta}>
                            {group.memberCount} members
                          </span>
                        </div>
                        <button
                          onClick={() => handleJoinGroup(group._id)}
                          style={styles.joinButton}
                        >
                          Join
                        </button>
                      </div>
                    ))
                ) : (
                  <div style={styles.emptyState}>
                    <p style={styles.emptyText}>No public groups to discover</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "invites" && (
              <div style={styles.groupList}>
                {pendingInvites && pendingInvites.length > 0 ? (
                  pendingInvites.map((invite) => (
                    <div key={invite._id} style={styles.inviteCard}>
                      <div
                        style={{
                          ...styles.groupAvatar,
                          backgroundColor: invite.group?.avatarColor || "#8B5CF6",
                        }}
                      >
                        {invite.group?.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div style={styles.groupInfo}>
                        <span style={styles.groupName}>
                          {invite.group?.name || "Unknown Group"}
                        </span>
                        <span style={styles.groupMeta}>
                          Invited by {invite.fromUser?.username || "someone"}
                        </span>
                      </div>
                      <div style={styles.inviteActions}>
                        <button
                          onClick={() => handleRespondToInvite(invite._id, true)}
                          style={styles.acceptButton}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRespondToInvite(invite._id, false)}
                          style={styles.declineButton}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={styles.emptyState}>
                    <p style={styles.emptyText}>No pending invites</p>
                  </div>
                )}
              </div>
            )}
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
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  },
  tabActive: {
    color: "#8B5CF6",
    borderBottomColor: "#8B5CF6",
  },
  badge: {
    backgroundColor: "#EF4444",
    color: "#fff",
    padding: "2px 6px",
    borderRadius: "10px",
    fontSize: "11px",
    fontWeight: "bold",
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
  groupList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  groupCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    backgroundColor: "#262626",
    borderRadius: "12px",
  },
  inviteCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    backgroundColor: "#262626",
    borderRadius: "12px",
    flexWrap: "wrap",
  },
  groupAvatar: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "bold",
    color: "#fff",
    flexShrink: 0,
  },
  groupInfo: {
    flex: 1,
    minWidth: 0,
  },
  groupName: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#fff",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  groupMeta: {
    display: "block",
    fontSize: "12px",
    color: "#888",
    marginTop: "2px",
  },
  joinButton: {
    padding: "8px 16px",
    backgroundColor: "#8B5CF6",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    cursor: "pointer",
  },
  leaveButton: {
    padding: "8px 16px",
    backgroundColor: "transparent",
    color: "#888",
    border: "1px solid #444",
    borderRadius: "6px",
    fontSize: "13px",
    cursor: "pointer",
  },
  inviteActions: {
    display: "flex",
    gap: "8px",
    width: "100%",
    marginTop: "8px",
  },
  acceptButton: {
    flex: 1,
    padding: "8px",
    backgroundColor: "#22c55e",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    cursor: "pointer",
  },
  declineButton: {
    flex: 1,
    padding: "8px",
    backgroundColor: "#333",
    color: "#888",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    cursor: "pointer",
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
  colorPicker: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  colorLabel: {
    fontSize: "14px",
    color: "#888",
  },
  colorOptions: {
    display: "flex",
    gap: "8px",
  },
  colorOption: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    border: "2px solid transparent",
    cursor: "pointer",
  },
  colorOptionSelected: {
    borderColor: "#fff",
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
