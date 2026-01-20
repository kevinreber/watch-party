import { useState, useEffect, useCallback, useRef, type CSSProperties } from "react";
import type { RealtimeChannel, Message as AblyMessage } from "ably";
import type { Poll as PollType, PollOption } from "~/types";
import { pollService } from "~/services/pollService";

interface PollProps {
  channel: RealtimeChannel | null;
  roomId: string;
  username: string;
  clientId?: string;
  onPollAvailable?: (hasActivePoll: boolean) => void;
}

export function Poll({ channel, roomId, username, clientId, onPollAvailable }: PollProps) {
  const [currentPoll, setCurrentPoll] = useState<PollType | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPollHistory, setShowPollHistory] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const hasRequestedSync = useRef(false);
  const currentPollRef = useRef<PollType | null>(null);

  // Keep ref in sync with state for use in callbacks
  useEffect(() => {
    currentPollRef.current = currentPoll;
  }, [currentPoll]);

  // Notify parent when poll availability changes
  useEffect(() => {
    onPollAvailable?.(currentPoll !== null && currentPoll.isActive);
  }, [currentPoll, onPollAvailable]);

  // Get active poll on mount and request sync from other users
  useEffect(() => {
    // First check local storage
    const localPoll = pollService.getActivePoll(roomId);
    if (localPoll) {
      setCurrentPoll(localPoll);
    }
  }, [roomId]);

  // Request poll sync when channel becomes available
  useEffect(() => {
    if (!channel || hasRequestedSync.current) return;

    // Small delay to ensure we're connected
    const timer = setTimeout(() => {
      hasRequestedSync.current = true;
      channel.publish("poll-request", { roomId, requesterId: clientId });
    }, 500);

    return () => clearTimeout(timer);
  }, [channel, roomId, clientId]);

  // Listen for poll updates via Ably
  useEffect(() => {
    if (!channel) return;

    const handlePollUpdate = (message: AblyMessage) => {
      const data = message.data as { poll: PollType; senderId?: string };
      const { poll, senderId } = data;
      // Don't update from our own messages (we already updated locally)
      if (senderId === clientId) return;
      setCurrentPoll(poll);
      // Also save to local storage
      pollService.savePoll(roomId, poll);
    };

    const handlePollEnd = (message: AblyMessage) => {
      const data = message.data as { senderId?: string };
      const { senderId } = data;
      if (senderId === clientId) return;
      setCurrentPoll(prev => prev ? { ...prev, isActive: false } : null);
    };

    // Handle poll sync requests from new joiners
    const handlePollRequest = (message: AblyMessage) => {
      const data = message.data as { requesterId?: string };
      // Don't respond to our own request
      if (data.requesterId === clientId) return;

      // If we have a poll, send it to the requester (use ref to avoid stale closure)
      if (currentPollRef.current) {
        channel.publish("poll-sync", {
          poll: currentPollRef.current,
          senderId: clientId,
          targetId: data.requesterId
        });
      }
    };

    // Handle poll sync responses
    const handlePollSync = (message: AblyMessage) => {
      const data = message.data as { poll: PollType; senderId?: string; targetId?: string };
      // Only process if this sync is for us or broadcast
      if (data.targetId && data.targetId !== clientId) return;
      // Don't process our own sync messages
      if (data.senderId === clientId) return;

      // Only update if we don't have a poll yet (use ref to avoid stale closure)
      if (!currentPollRef.current && data.poll) {
        // Save poll first so voting will work
        pollService.savePoll(roomId, data.poll);
        setCurrentPoll(data.poll);
      }
    };

    channel.subscribe("poll-update", handlePollUpdate);
    channel.subscribe("poll-ended", handlePollEnd);
    channel.subscribe("poll-request", handlePollRequest);
    channel.subscribe("poll-sync", handlePollSync);

    return () => {
      channel.unsubscribe("poll-update", handlePollUpdate);
      channel.unsubscribe("poll-ended", handlePollEnd);
      channel.unsubscribe("poll-request", handlePollRequest);
      channel.unsubscribe("poll-sync", handlePollSync);
    };
  }, [channel, clientId, roomId]);

  // Create a poll
  const handleCreatePoll = useCallback(() => {
    if (!question.trim() || options.filter(o => o.trim()).length < 2) return;

    const validOptions = options.filter(o => o.trim());
    const poll = pollService.createPoll(roomId, question, validOptions, 5);
    setCurrentPoll(poll);

    // Broadcast to other users via Ably
    if (channel) {
      channel.publish("poll-update", { roomId, poll, senderId: clientId });
    }

    // Reset form
    setQuestion("");
    setOptions(["", ""]);
    setShowCreateForm(false);
  }, [question, options, roomId, channel, clientId]);

  // Vote on a poll
  const handleVote = useCallback((optionId: string) => {
    if (!currentPoll) return;

    const updatedPoll = pollService.vote(roomId, currentPoll.id, optionId);
    if (updatedPoll) {
      setCurrentPoll(updatedPoll);

      // Broadcast to other users via Ably
      if (channel) {
        channel.publish("poll-update", { roomId, poll: updatedPoll, senderId: clientId });
      }
    }
  }, [currentPoll, roomId, channel, clientId]);

  // End poll
  const handleEndPoll = useCallback(() => {
    if (!currentPoll) return;

    pollService.endPoll(roomId, currentPoll.id);
    setCurrentPoll(prev => prev ? { ...prev, isActive: false } : null);

    if (channel) {
      channel.publish("poll-ended", { roomId, pollId: currentPoll.id, senderId: clientId });
    }
  }, [currentPoll, roomId, channel, clientId]);

  // Add option to form
  const addOption = () => {
    if (options.length < 4) {
      setOptions([...options, ""]);
    }
  };

  // Update option in form
  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const hasVoted = currentPoll ? pollService.hasUserVoted(currentPoll) : false;
  const userVote = currentPoll ? pollService.getUserVote(currentPoll) : null;

  // Calculate vote percentages
  const getPercentage = (option: PollOption) => {
    if (!currentPoll || currentPoll.totalVotes === 0) return 0;
    return Math.round((option.votes / currentPoll.totalVotes) * 100);
  };

  // Check if this option is the user's current vote
  const isUserVote = (option: PollOption) => userVote?.id === option.id;

  return (
    <div style={styles.container} data-testid="poll-container">
      {/* Active Poll */}
      {currentPoll && (
        <div style={styles.pollCard}>
          <div style={styles.pollHeader}>
            <h4 style={styles.pollQuestion}>{currentPoll.question}</h4>
            <span style={styles.voteCount}>{currentPoll.totalVotes} votes</span>
          </div>

          <div style={styles.optionsList}>
            {currentPoll.options.map(option => (
              <button
                key={option.id}
                onClick={() => currentPoll.isActive && handleVote(option.id)}
                disabled={!currentPoll.isActive}
                style={{
                  ...styles.optionButton,
                  ...(isUserVote(option) ? styles.selectedOption : {}),
                  ...(!currentPoll.isActive ? styles.disabledOption : {}),
                }}
                data-testid={`poll-option-${option.id}`}
              >
                <div
                  style={{
                    ...styles.progressBar,
                    ...(isUserVote(option) ? styles.selectedProgressBar : {}),
                    width: `${getPercentage(option)}%`,
                  }}
                />
                <span style={styles.optionText}>
                  {isUserVote(option) && "✓ "}
                  {option.text}
                </span>
                {(hasVoted || !currentPoll.isActive) && (
                  <span style={styles.percentage}>{getPercentage(option)}%</span>
                )}
              </button>
            ))}
          </div>

          {currentPoll.isActive && hasVoted && (
            <div style={styles.voteHint}>Click your selection again to remove, or click another option to change your vote</div>
          )}

          {currentPoll.isActive && currentPoll.creatorName === username && (
            <button onClick={handleEndPoll} style={styles.endButton}>
              End Poll
            </button>
          )}

          {!currentPoll.isActive && (
            <div style={styles.closedBadge}>Poll Closed</div>
          )}

          {/* Start New Poll button - always available */}
          <button
            onClick={() => {
              setCurrentPoll(null);
              setShowCreateForm(true);
            }}
            style={styles.newPollButton}
          >
            Start New Poll
          </button>
        </div>
      )}

      {/* Poll History Toggle */}
      {pollService.getPolls(roomId).length > 0 && (
        <button
          onClick={() => setShowPollHistory(!showPollHistory)}
          style={styles.historyToggle}
        >
          {showPollHistory ? "Hide History" : `View History (${pollService.getPolls(roomId).filter(p => !p.isActive).length})`}
        </button>
      )}

      {/* Poll History */}
      {showPollHistory && (
        <div style={styles.pollHistory}>
          <h5 style={styles.historyTitle}>Past Polls</h5>
          {pollService.getPolls(roomId)
            .filter(p => !p.isActive)
            .map(poll => (
              <div key={poll.id} style={styles.historyItem}>
                <div style={styles.historyQuestion}>{poll.question}</div>
                <div style={styles.historyMeta}>
                  {poll.totalVotes} votes • by {poll.creatorName}
                </div>
                <div style={styles.historyOptions}>
                  {poll.options.map(opt => (
                    <div key={opt.id} style={styles.historyOption}>
                      {opt.text}: {poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0}%
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Create Poll Button / Form */}
      {!currentPoll && (
        <>
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              style={styles.createButton}
              data-testid="create-poll-button"
            >
              📊 Create Poll
            </button>
          ) : (
            <div style={styles.createForm} data-testid="poll-form">
              <input
                type="text"
                placeholder="Ask a question..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                style={styles.input}
                data-testid="poll-question-input"
              />

              {options.map((option, index) => (
                <input
                  key={index}
                  type="text"
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  style={styles.input}
                  data-testid={`poll-option-input-${index}`}
                />
              ))}

              {options.length < 4 && (
                <button onClick={addOption} style={styles.addOptionButton}>
                  + Add Option
                </button>
              )}

              <div style={styles.formActions}>
                <button onClick={() => setShowCreateForm(false)} style={styles.cancelButton}>
                  Cancel
                </button>
                <button
                  onClick={handleCreatePoll}
                  disabled={!question.trim() || options.filter(o => o.trim()).length < 2}
                  style={styles.submitButton}
                  data-testid="submit-poll-button"
                >
                  Create Poll
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    padding: "1rem",
  },
  pollCard: {
    background: "#262626",
    borderRadius: "12px",
    padding: "1rem",
    border: "1px solid #333",
  },
  pollHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1rem",
  },
  pollQuestion: {
    margin: 0,
    fontSize: "1rem",
    fontWeight: 600,
    color: "#ffffff",
    flex: 1,
  },
  voteCount: {
    fontSize: "0.75rem",
    color: "#a3a3a3",
    marginLeft: "0.5rem",
  },
  optionsList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  optionButton: {
    position: "relative",
    width: "100%",
    padding: "0.75rem 1rem",
    background: "#1a1a1a",
    border: "1px solid #404040",
    borderRadius: "8px",
    color: "#ffffff",
    textAlign: "left",
    cursor: "pointer",
    overflow: "hidden",
    transition: "border-color 0.2s ease",
  },
  votedOption: {
    cursor: "default",
  },
  selectedOption: {
    border: "2px solid #6366f1",
    background: "rgba(99, 102, 241, 0.1)",
  },
  disabledOption: {
    cursor: "default",
    opacity: 0.8,
  },
  selectedProgressBar: {
    background: "rgba(99, 102, 241, 0.5)",
  },
  voteHint: {
    fontSize: "0.7rem",
    color: "#737373",
    textAlign: "center",
    marginTop: "0.5rem",
    fontStyle: "italic",
  },
  progressBar: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    background: "rgba(99, 102, 241, 0.3)",
    transition: "width 0.3s ease",
  },
  optionText: {
    position: "relative",
    zIndex: 1,
  },
  percentage: {
    position: "absolute",
    right: "1rem",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#6366f1",
    zIndex: 1,
  },
  endButton: {
    width: "100%",
    marginTop: "1rem",
    padding: "0.5rem",
    background: "#ef4444",
    border: "none",
    borderRadius: "6px",
    color: "#ffffff",
    fontSize: "0.875rem",
    fontWeight: 500,
    cursor: "pointer",
  },
  closedBadge: {
    textAlign: "center",
    marginTop: "1rem",
    padding: "0.5rem",
    background: "#404040",
    borderRadius: "6px",
    color: "#a3a3a3",
    fontSize: "0.875rem",
  },
  newPollButton: {
    width: "100%",
    marginTop: "0.75rem",
    padding: "0.5rem",
    background: "transparent",
    border: "1px solid #404040",
    borderRadius: "6px",
    color: "#a3a3a3",
    fontSize: "0.75rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  historyToggle: {
    width: "100%",
    marginTop: "0.75rem",
    padding: "0.5rem",
    background: "transparent",
    border: "none",
    color: "#6366f1",
    fontSize: "0.75rem",
    cursor: "pointer",
    textAlign: "center",
  },
  pollHistory: {
    marginTop: "0.75rem",
    padding: "0.75rem",
    background: "#1a1a1a",
    borderRadius: "8px",
    border: "1px solid #333",
  },
  historyTitle: {
    margin: "0 0 0.5rem 0",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#a3a3a3",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  historyItem: {
    padding: "0.5rem 0",
    borderBottom: "1px solid #333",
  },
  historyQuestion: {
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#ffffff",
    marginBottom: "0.25rem",
  },
  historyMeta: {
    fontSize: "0.7rem",
    color: "#737373",
    marginBottom: "0.25rem",
  },
  historyOptions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
  },
  historyOption: {
    fontSize: "0.7rem",
    color: "#a3a3a3",
    background: "#262626",
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
  },
  createButton: {
    width: "100%",
    padding: "0.75rem",
    background: "#262626",
    border: "1px dashed #404040",
    borderRadius: "8px",
    color: "#a3a3a3",
    fontSize: "0.875rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  createForm: {
    background: "#262626",
    borderRadius: "12px",
    padding: "1rem",
    border: "1px solid #333",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  input: {
    width: "100%",
    padding: "0.75rem",
    background: "#1a1a1a",
    border: "1px solid #404040",
    borderRadius: "6px",
    color: "#ffffff",
    fontSize: "0.875rem",
    outline: "none",
  },
  addOptionButton: {
    padding: "0.5rem",
    background: "transparent",
    border: "1px dashed #404040",
    borderRadius: "6px",
    color: "#a3a3a3",
    fontSize: "0.75rem",
    cursor: "pointer",
  },
  formActions: {
    display: "flex",
    gap: "0.5rem",
    marginTop: "0.5rem",
  },
  cancelButton: {
    flex: 1,
    padding: "0.5rem",
    background: "transparent",
    border: "1px solid #404040",
    borderRadius: "6px",
    color: "#a3a3a3",
    fontSize: "0.875rem",
    cursor: "pointer",
  },
  submitButton: {
    flex: 1,
    padding: "0.5rem",
    background: "#6366f1",
    border: "none",
    borderRadius: "6px",
    color: "#ffffff",
    fontSize: "0.875rem",
    fontWeight: 500,
    cursor: "pointer",
  },
};
