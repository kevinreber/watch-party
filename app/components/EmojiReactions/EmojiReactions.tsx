import { useState, useEffect, useCallback, type CSSProperties } from "react";
import type { Socket } from "socket.io-client";
import type { Reaction, ReactionEmoji } from "~/types";

interface EmojiReactionsProps {
  socket: Socket | null;
  roomId?: string;
  username: string;
}

const REACTION_EMOJIS: ReactionEmoji[] = ["😂", "❤️", "🔥", "👏", "😮", "😢", "🎉", "👀"];

export function EmojiReactions({ socket, roomId, username }: EmojiReactionsProps) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  // Generate random position
  const getRandomPosition = () => ({
    x: 20 + Math.random() * 60, // 20-80% from left
    y: 70 + Math.random() * 20, // 70-90% from top
  });

  // Add a reaction
  const addReaction = useCallback((emoji: ReactionEmoji) => {
    const { x, y } = getRandomPosition();
    const reaction: Reaction = {
      id: `${Date.now()}-${Math.random()}`,
      emoji,
      userId: socket?.id || "local",
      username,
      timestamp: Date.now(),
      x,
      y,
    };

    setReactions(prev => [...prev, reaction]);

    // Emit to other users
    if (socket && roomId) {
      socket.emit("REACTION:send", { roomId, reaction });
    }

    // Remove after animation
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== reaction.id));
    }, 3000);

    setShowPicker(false);
  }, [socket, roomId, username]);

  // Listen for reactions from other users
  useEffect(() => {
    if (!socket) return;

    const handleReaction = (reaction: Reaction) => {
      setReactions(prev => [...prev, reaction]);
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== reaction.id));
      }, 3000);
    };

    socket.on("REACTION:receive", handleReaction);

    return () => {
      socket.off("REACTION:receive", handleReaction);
    };
  }, [socket]);

  return (
    <div style={styles.container}>
      {/* Floating reactions */}
      {reactions.map(reaction => (
        <div
          key={reaction.id}
          style={{
            ...styles.floatingReaction,
            left: `${reaction.x}%`,
            bottom: `${reaction.y}%`,
          }}
          data-testid="floating-reaction"
        >
          <span style={styles.reactionEmoji}>{reaction.emoji}</span>
          <span style={styles.reactionUser}>{reaction.username}</span>
        </div>
      ))}

      {/* Reaction button */}
      <div style={styles.buttonContainer}>
        <button
          onClick={() => setShowPicker(!showPicker)}
          style={styles.reactionButton}
          aria-label="Add reaction"
          data-testid="reaction-button"
        >
          🎉
        </button>

        {/* Emoji picker */}
        {showPicker && (
          <div style={styles.picker} data-testid="emoji-picker">
            {REACTION_EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={() => addReaction(emoji)}
                style={styles.emojiButton}
                data-testid={`emoji-${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    overflow: "hidden",
  },
  floatingReaction: {
    position: "absolute",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    animation: "floatUp 3s ease-out forwards",
    pointerEvents: "none",
  },
  reactionEmoji: {
    fontSize: "2.5rem",
    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
  },
  reactionUser: {
    fontSize: "0.75rem",
    color: "#ffffff",
    background: "rgba(0,0,0,0.5)",
    padding: "2px 6px",
    borderRadius: "4px",
    marginTop: "4px",
  },
  buttonContainer: {
    position: "absolute",
    bottom: "1rem",
    right: "1rem",
    pointerEvents: "auto",
  },
  reactionButton: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "rgba(99, 102, 241, 0.9)",
    border: "none",
    fontSize: "1.5rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    transition: "transform 0.2s ease",
  },
  picker: {
    position: "absolute",
    bottom: "60px",
    right: 0,
    background: "#1a1a1a",
    borderRadius: "12px",
    padding: "8px",
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "4px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
    border: "1px solid #333",
  },
  emojiButton: {
    width: "40px",
    height: "40px",
    border: "none",
    background: "transparent",
    fontSize: "1.5rem",
    cursor: "pointer",
    borderRadius: "8px",
    transition: "background 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

// Add animation keyframes
if (typeof document !== "undefined") {
  const styleEl = document.createElement("style");
  styleEl.textContent = `
    @keyframes floatUp {
      0% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      50% {
        opacity: 1;
        transform: translateY(-50px) scale(1.2);
      }
      100% {
        opacity: 0;
        transform: translateY(-120px) scale(0.8);
      }
    }
  `;
  document.head.appendChild(styleEl);
}
