import { useState, type CSSProperties } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

interface InviteLinkModalProps {
  roomId: string;
  roomName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const InviteLinkModal = ({
  roomId,
  roomName,
  isOpen,
  onClose,
}: InviteLinkModalProps) => {
  const [maxUses, setMaxUses] = useState<number | undefined>(undefined);
  const [expiresInHours, setExpiresInHours] = useState<number | undefined>(24);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const inviteLinks = useQuery(api.inviteLinks.getRoomInviteLinks, {
    roomId: roomId as Id<"rooms">,
  });
  const createInviteLink = useMutation(api.inviteLinks.createInviteLink);
  const deactivateLink = useMutation(api.inviteLinks.deactivateInviteLink);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      await createInviteLink({
        roomId: roomId as Id<"rooms">,
        maxUses: maxUses,
        expiresInHours: expiresInHours,
      });
    } catch (error) {
      console.error("Failed to create invite link:", error);
    }
    setIsCreating(false);
  };

  const handleCopy = async (code: string) => {
    const inviteUrl = `${window.location.origin}/join/${code}`;
    await navigator.clipboard.writeText(inviteUrl);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDeactivate = async (inviteLinkId: string) => {
    try {
      await deactivateLink({ inviteLinkId: inviteLinkId as Id<"inviteLinks"> });
    } catch (error) {
      console.error("Failed to deactivate link:", error);
    }
  };

  const handleShare = async (code: string) => {
    const inviteUrl = `${window.location.origin}/join/${code}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${roomName} on Watch Party`,
          text: `Join my watch party room!`,
          url: inviteUrl,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopy(code);
    }
  };

  if (!isOpen) return null;

  const activeLinks = inviteLinks?.filter((l) => l.isActive && !l.isExpired && !l.isMaxUsesReached) || [];

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Invite to {roomName}</h2>
          <button onClick={onClose} style={styles.closeButton}>
            ✕
          </button>
        </div>

        <div style={styles.content}>
          {/* Quick Share Section */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Quick Share</h3>
            <div style={styles.quickShare}>
              <button
                onClick={() => handleCopy(roomId)}
                style={styles.shareButton}
              >
                <span style={styles.shareIcon}>🔗</span>
                <span>Copy Room Link</span>
              </button>
              {navigator.share && (
                <button
                  onClick={() => handleShare(roomId)}
                  style={styles.shareButton}
                >
                  <span style={styles.shareIcon}>📤</span>
                  <span>Share</span>
                </button>
              )}
            </div>
          </div>

          {/* Create Invite Link Section */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Create Invite Link</h3>
            <p style={styles.sectionDescription}>
              Create a special invite link with custom settings
            </p>

            <div style={styles.options}>
              <div style={styles.option}>
                <label style={styles.optionLabel}>Max Uses</label>
                <select
                  value={maxUses ?? "unlimited"}
                  onChange={(e) =>
                    setMaxUses(
                      e.target.value === "unlimited"
                        ? undefined
                        : parseInt(e.target.value)
                    )
                  }
                  style={styles.select}
                >
                  <option value="unlimited">Unlimited</option>
                  <option value="1">1 use</option>
                  <option value="5">5 uses</option>
                  <option value="10">10 uses</option>
                  <option value="25">25 uses</option>
                </select>
              </div>

              <div style={styles.option}>
                <label style={styles.optionLabel}>Expires In</label>
                <select
                  value={expiresInHours ?? "never"}
                  onChange={(e) =>
                    setExpiresInHours(
                      e.target.value === "never"
                        ? undefined
                        : parseInt(e.target.value)
                    )
                  }
                  style={styles.select}
                >
                  <option value="1">1 hour</option>
                  <option value="6">6 hours</option>
                  <option value="24">24 hours</option>
                  <option value="168">7 days</option>
                  <option value="never">Never</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={isCreating}
              style={styles.createButton}
            >
              {isCreating ? "Creating..." : "Create Invite Link"}
            </button>
          </div>

          {/* Active Links Section */}
          {activeLinks.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Active Links</h3>
              <div style={styles.linkList}>
                {activeLinks.map((link) => (
                  <div key={link._id} style={styles.linkCard}>
                    <div style={styles.linkInfo}>
                      <code style={styles.linkCode}>{link.code}</code>
                      <span style={styles.linkStats}>
                        {link.useCount} uses
                        {link.maxUses && ` / ${link.maxUses} max`}
                        {link.expiresAt && ` · Expires ${formatExpiry(link.expiresAt)}`}
                      </span>
                    </div>
                    <div style={styles.linkActions}>
                      <button
                        onClick={() => handleCopy(link.code)}
                        style={styles.linkAction}
                      >
                        {copiedCode === link.code ? "Copied!" : "Copy"}
                      </button>
                      <button
                        onClick={() => handleDeactivate(link._id)}
                        style={{ ...styles.linkAction, ...styles.linkActionDanger }}
                      >
                        Revoke
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function formatExpiry(timestamp: number): string {
  const diff = timestamp - Date.now();
  if (diff < 0) return "expired";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) return `in ${hours}h`;

  const days = Math.floor(hours / 24);

  return `in ${days}d`;
}

const styles: Record<string, CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  },
  modal: {
    width: "100%",
    maxWidth: "480px",
    maxHeight: "90vh",
    backgroundColor: "#1a1a1a",
    borderRadius: "16px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px",
    borderBottom: "1px solid #262626",
  },
  title: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "600",
    color: "#fff",
  },
  closeButton: {
    width: "32px",
    height: "32px",
    border: "none",
    backgroundColor: "#262626",
    borderRadius: "8px",
    color: "#888",
    cursor: "pointer",
    fontSize: "14px",
  },
  content: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
  },
  section: {
    marginBottom: "24px",
  },
  sectionTitle: {
    margin: "0 0 8px 0",
    fontSize: "14px",
    fontWeight: "600",
    color: "#fff",
  },
  sectionDescription: {
    margin: "0 0 16px 0",
    fontSize: "13px",
    color: "#888",
  },
  quickShare: {
    display: "flex",
    gap: "12px",
  },
  shareButton: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "12px",
    backgroundColor: "#262626",
    border: "none",
    borderRadius: "10px",
    color: "#fff",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  shareIcon: {
    fontSize: "18px",
  },
  options: {
    display: "flex",
    gap: "12px",
    marginBottom: "16px",
  },
  option: {
    flex: 1,
  },
  optionLabel: {
    display: "block",
    marginBottom: "6px",
    fontSize: "12px",
    color: "#888",
  },
  select: {
    width: "100%",
    padding: "10px 12px",
    backgroundColor: "#262626",
    border: "1px solid #333",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "14px",
    cursor: "pointer",
  },
  createButton: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#8B5CF6",
    border: "none",
    borderRadius: "10px",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  linkList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  linkCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px",
    backgroundColor: "#262626",
    borderRadius: "10px",
  },
  linkInfo: {
    flex: 1,
    minWidth: 0,
  },
  linkCode: {
    display: "block",
    fontSize: "16px",
    fontWeight: "600",
    color: "#8B5CF6",
    fontFamily: "monospace",
  },
  linkStats: {
    display: "block",
    fontSize: "12px",
    color: "#666",
    marginTop: "4px",
  },
  linkActions: {
    display: "flex",
    gap: "8px",
  },
  linkAction: {
    padding: "6px 12px",
    backgroundColor: "#333",
    border: "none",
    borderRadius: "6px",
    color: "#fff",
    fontSize: "12px",
    cursor: "pointer",
  },
  linkActionDanger: {
    color: "#ef4444",
  },
};
