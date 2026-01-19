import { useState, useEffect, type CSSProperties } from "react";
import { useNavigate } from "react-router";
import type { ScheduledParty, Video } from "~/types";
import { scheduledPartyService } from "~/services/scheduledPartyService";

interface ScheduledPartiesProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScheduledParties({ isOpen, onClose }: ScheduledPartiesProps) {
  const navigate = useNavigate();
  const [parties, setParties] = useState<ScheduledParty[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");

  useEffect(() => {
    if (isOpen) {
      setParties(scheduledPartyService.getUpcomingParties());
    }
  }, [isOpen]);

  const handleCreate = () => {
    if (!name.trim() || !scheduledFor) return;

    const party = scheduledPartyService.createScheduledParty(
      name,
      new Date(scheduledFor).toISOString(),
      description
    );
    setParties(prev => [...prev, party].sort(
      (a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
    ));
    resetForm();
  };

  const handleDelete = (partyId: string) => {
    scheduledPartyService.deleteScheduledParty(partyId);
    setParties(prev => prev.filter(p => p.id !== partyId));
  };

  const handleJoin = (roomId: string) => {
    onClose();
    navigate(`/room/${roomId}`);
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setScheduledFor("");
    setShowCreateForm(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    if (diff < 0) return "Started";
    if (diff < 60000) return "Starting now!";
    if (diff < 3600000) return `In ${Math.round(diff / 60000)} min`;
    if (diff < 86400000) return `In ${Math.round(diff / 3600000)} hours`;

    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const isPartySoon = (party: ScheduledParty) => {
    return scheduledPartyService.isPartySoon(party);
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose} data-testid="scheduled-parties">
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Scheduled Parties</h2>
          <button onClick={onClose} style={styles.closeButton}>✕</button>
        </div>

        <div style={styles.content}>
          {/* Create button / form */}
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              style={styles.createButton}
              data-testid="create-party-button"
            >
              📅 Schedule a Watch Party
            </button>
          ) : (
            <div style={styles.createForm} data-testid="party-form">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Party name"
                style={styles.input}
                data-testid="party-name-input"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                style={styles.textarea}
                rows={2}
              />
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                style={styles.input}
                min={new Date().toISOString().slice(0, 16)}
                data-testid="party-datetime-input"
              />
              <div style={styles.formActions}>
                <button onClick={resetForm} style={styles.cancelButton}>
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!name.trim() || !scheduledFor}
                  style={styles.submitButton}
                  data-testid="submit-party-button"
                >
                  Schedule
                </button>
              </div>
            </div>
          )}

          {/* Parties list */}
          <div style={styles.partiesList}>
            {parties.length === 0 ? (
              <p style={styles.emptyText}>No scheduled parties yet</p>
            ) : (
              parties.map(party => (
                <div
                  key={party.id}
                  style={{
                    ...styles.partyCard,
                    ...(isPartySoon(party) ? styles.partyCardSoon : {}),
                  }}
                  data-testid={`party-${party.id}`}
                >
                  <div style={styles.partyHeader}>
                    <h3 style={styles.partyName}>{party.name}</h3>
                    <span
                      style={{
                        ...styles.partyTime,
                        color: isPartySoon(party) ? "#22c55e" : "#a3a3a3",
                      }}
                    >
                      {formatDate(party.scheduledFor)}
                    </span>
                  </div>

                  {party.description && (
                    <p style={styles.partyDescription}>{party.description}</p>
                  )}

                  <div style={styles.partyMeta}>
                    <span style={styles.partyCreator}>
                      By {party.creatorName}
                    </span>
                    <span style={styles.partyInvited}>
                      {party.acceptedUsers.length} attending
                    </span>
                  </div>

                  <div style={styles.partyActions}>
                    <button
                      onClick={() => handleJoin(party.roomId)}
                      style={styles.joinButton}
                      data-testid={`join-party-${party.id}`}
                    >
                      {isPartySoon(party) ? "Join Now" : "View Room"}
                    </button>
                    <button
                      onClick={() => handleDelete(party.id)}
                      style={styles.deleteButton}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
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
    maxWidth: "500px",
    maxHeight: "80vh",
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
    padding: "1rem",
  },
  createButton: {
    width: "100%",
    padding: "1rem",
    background: "#262626",
    border: "1px dashed #404040",
    borderRadius: "12px",
    color: "#a3a3a3",
    fontSize: "0.875rem",
    cursor: "pointer",
    marginBottom: "1rem",
  },
  createForm: {
    background: "#262626",
    borderRadius: "12px",
    padding: "1rem",
    marginBottom: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  input: {
    padding: "0.75rem",
    background: "#1a1a1a",
    border: "1px solid #404040",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "0.875rem",
    outline: "none",
  },
  textarea: {
    padding: "0.75rem",
    background: "#1a1a1a",
    border: "1px solid #404040",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "0.875rem",
    outline: "none",
    resize: "none",
  },
  formActions: {
    display: "flex",
    gap: "0.5rem",
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
  submitButton: {
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
  partiesList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  emptyText: {
    color: "#737373",
    textAlign: "center",
    padding: "2rem",
    fontSize: "0.875rem",
  },
  partyCard: {
    background: "#262626",
    borderRadius: "12px",
    padding: "1rem",
    border: "1px solid #333",
  },
  partyCardSoon: {
    borderColor: "#22c55e",
    boxShadow: "0 0 10px rgba(34, 197, 94, 0.2)",
  },
  partyHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "0.5rem",
  },
  partyName: {
    margin: 0,
    fontSize: "1rem",
    fontWeight: 600,
    color: "#ffffff",
  },
  partyTime: {
    fontSize: "0.75rem",
    fontWeight: 500,
  },
  partyDescription: {
    margin: "0 0 0.75rem 0",
    fontSize: "0.875rem",
    color: "#a3a3a3",
  },
  partyMeta: {
    display: "flex",
    gap: "1rem",
    marginBottom: "0.75rem",
  },
  partyCreator: {
    fontSize: "0.75rem",
    color: "#737373",
  },
  partyInvited: {
    fontSize: "0.75rem",
    color: "#737373",
  },
  partyActions: {
    display: "flex",
    gap: "0.5rem",
  },
  joinButton: {
    flex: 1,
    padding: "0.5rem",
    background: "#6366f1",
    border: "none",
    borderRadius: "6px",
    color: "#ffffff",
    fontSize: "0.75rem",
    fontWeight: 500,
    cursor: "pointer",
  },
  deleteButton: {
    padding: "0.5rem 0.75rem",
    background: "transparent",
    border: "1px solid #404040",
    borderRadius: "6px",
    color: "#a3a3a3",
    fontSize: "0.75rem",
    cursor: "pointer",
  },
};
