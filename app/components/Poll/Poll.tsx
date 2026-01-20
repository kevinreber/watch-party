import { useState, useEffect, useCallback, type CSSProperties } from "react";
import type { RealtimeChannel, Message as AblyMessage } from "ably";
import type { Poll as PollType, PollOption } from "~/types";
import { pollService } from "~/services/pollService";

interface PollProps {
  channel: RealtimeChannel | null;
  roomId: string;
  username: string;
  clientId?: string;
}

export function Poll({ channel, roomId, username, clientId }: PollProps) {
  const [currentPoll, setCurrentPoll] = useState<PollType | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  // Get active poll on mount
  useEffect(() => {
    const poll = pollService.getActivePoll(roomId);
    setCurrentPoll(poll);
  }, [roomId]);

  // Listen for poll updates via Ably
  useEffect(() => {
    if (!channel) return;

    const handlePollUpdate = (message: AblyMessage) => {
      const data = message.data as { poll: PollType; senderId?: string };
      const { poll, senderId } = data;
      // Don't update from our own messages (we already updated locally)
      if (senderId === clientId) return;
      setCurrentPoll(poll);
    };

    const handlePollEnd = (message: AblyMessage) => {
      const data = message.data as { senderId?: string };
      const { senderId } = data;
      if (senderId === clientId) return;
      setCurrentPoll(prev => prev ? { ...prev, isActive: false } : null);
    };

    channel.subscribe("poll-update", handlePollUpdate);
    channel.subscribe("poll-ended", handlePollEnd);

    return () => {
      channel.unsubscribe("poll-update", handlePollUpdate);
      channel.unsubscribe("poll-ended", handlePollEnd);
    };
  }, [channel, clientId]);

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

  // Calculate vote percentages
  const getPercentage = (option: PollOption) => {
    if (!currentPoll || currentPoll.totalVotes === 0) return 0;
    return Math.round((option.votes / currentPoll.totalVotes) * 100);
  };

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
                onClick={() => !hasVoted && currentPoll.isActive && handleVote(option.id)}
                disabled={hasVoted || !currentPoll.isActive}
                style={{
                  ...styles.optionButton,
                  ...(hasVoted || !currentPoll.isActive ? styles.votedOption : {}),
                }}
                data-testid={`poll-option-${option.id}`}
              >
                <div
                  style={{
                    ...styles.progressBar,
                    width: `${getPercentage(option)}%`,
                  }}
                />
                <span style={styles.optionText}>{option.text}</span>
                {(hasVoted || !currentPoll.isActive) && (
                  <span style={styles.percentage}>{getPercentage(option)}%</span>
                )}
              </button>
            ))}
          </div>

          {currentPoll.isActive && currentPoll.creatorName === username && (
            <button onClick={handleEndPoll} style={styles.endButton}>
              End Poll
            </button>
          )}

          {!currentPoll.isActive && (
            <div style={styles.closedBadge}>Poll Closed</div>
          )}
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
