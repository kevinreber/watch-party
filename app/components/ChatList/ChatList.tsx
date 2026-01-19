import { useState, FormEvent, ChangeEvent, useRef, useEffect } from "react";
import moment from "moment";

interface Message {
  type: string;
  content: string;
  created_at: number;
  username: string;
}

interface ChatListProps {
  messages: Message[];
  sendMessage: (data: { content: string }) => void;
  userIsTyping: boolean;
  isTypingMessage: string;
  user: string;
  onTyping: () => void;
  onStopTyping: () => void;
}

export const ChatList = ({
  messages,
  sendMessage,
  userIsTyping,
  isTypingMessage,
  user,
  onTyping,
  onStopTyping,
}: ChatListProps) => {
  const [messageContent, setMessageContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMessageContent(e.target.value);
    // Emit typing event
    onTyping();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (messageContent.trim()) {
      sendMessage({ content: messageContent });
      setMessageContent("");
      // Clear typing indicator
      onStopTyping();
      inputRef.current?.focus();
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  // Generate consistent color for user
  const getUserColor = (name: string) => {
    const colors = [
      "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
      "#ec4899", "#f43f5e", "#ef4444", "#f97316",
      "#f59e0b", "#eab308", "#84cc16", "#22c55e",
      "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
      "#3b82f6", "#6366f1",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div style={styles.container}>
      {/* Messages list */}
      <div style={styles.messagesList}>
        {messages.length === 0 ? (
          <div style={styles.emptyState}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path
                d="M40 30C40 31.1046 39.5523 32.164 38.7678 32.9497C37.9832 33.7353 36.9255 34.1818 35.8182 34.1818H16.3636L8 42V12.3636C8 11.2591 8.44775 10.1997 9.23232 9.41405C10.0169 8.62838 11.0745 8.18182 12.1818 8.18182H35.8182C36.9255 8.18182 37.9832 8.62838 38.7678 9.41405C39.5523 10.1997 40 11.2591 40 12.3636V30Z"
                stroke="#333"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p style={styles.emptyText}>No messages yet</p>
            <p style={styles.emptySubtext}>Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.username === user;
            const isAdminMessage = message.type === "admin";

            if (isAdminMessage) {
              return (
                <div key={`${message.created_at}-${index}`} style={styles.adminMessage}>
                  <span>{message.content}</span>
                </div>
              );
            }

            return (
              <div
                key={`${message.created_at}-${index}`}
                style={{
                  ...styles.messageWrapper,
                  flexDirection: isOwnMessage ? "row-reverse" : "row",
                }}
              >
                <div
                  style={{
                    ...styles.avatar,
                    background: getUserColor(message.username),
                  }}
                >
                  {getInitials(message.username)}
                </div>
                <div style={{
                  ...styles.messageContent,
                  alignItems: isOwnMessage ? "flex-end" : "flex-start",
                }}>
                  <div style={styles.messageHeader}>
                    <span style={styles.messageUsername}>{message.username}</span>
                    <span style={styles.messageTime}>
                      {moment(message.created_at).format("h:mm a")}
                    </span>
                  </div>
                  <div
                    style={{
                      ...styles.messageBubble,
                      background: isOwnMessage
                        ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                        : "#262626",
                      borderBottomRightRadius: isOwnMessage ? "4px" : "16px",
                      borderBottomLeftRadius: isOwnMessage ? "16px" : "4px",
                    }}
                  >
                    {message.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {userIsTyping && (
        <div style={styles.typingIndicator}>
          <div style={styles.typingDots}>
            <span style={styles.typingDot} />
            <span style={{ ...styles.typingDot, animationDelay: "0.2s" }} />
            <span style={{ ...styles.typingDot, animationDelay: "0.4s" }} />
          </div>
          <span style={styles.typingText}>{isTypingMessage}</span>
        </div>
      )}

      {/* Input area */}
      <form onSubmit={handleSubmit} style={styles.inputArea}>
        <input
          ref={inputRef}
          type="text"
          value={messageContent}
          onChange={handleChange}
          placeholder="Type a message..."
          style={styles.input}
        />
        <button
          type="submit"
          disabled={!messageContent.trim()}
          style={{
            ...styles.sendButton,
            opacity: !messageContent.trim() ? 0.5 : 1,
            cursor: !messageContent.trim() ? "not-allowed" : "pointer",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M18.3334 1.66667L9.16669 10.8333M18.3334 1.66667L12.5 18.3333L9.16669 10.8333M18.3334 1.66667L1.66669 7.5L9.16669 10.8333"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </form>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  messagesList: {
    flex: 1,
    overflowY: "auto",
    padding: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  emptyState: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    opacity: 0.5,
  },
  emptyText: {
    fontSize: "1rem",
    fontWeight: 500,
    color: "#737373",
    margin: 0,
  },
  emptySubtext: {
    fontSize: "0.875rem",
    color: "#525252",
    margin: 0,
  },
  adminMessage: {
    textAlign: "center" as const,
    padding: "0.5rem 1rem",
    fontSize: "0.8125rem",
    color: "#737373",
    fontStyle: "italic",
  },
  messageWrapper: {
    display: "flex",
    gap: "0.75rem",
    animation: "fadeIn 0.2s ease-out",
  },
  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#ffffff",
    flexShrink: 0,
  },
  messageContent: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    maxWidth: "75%",
  },
  messageHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  messageUsername: {
    fontSize: "0.8125rem",
    fontWeight: 600,
    color: "#ffffff",
  },
  messageTime: {
    fontSize: "0.75rem",
    color: "#525252",
  },
  messageBubble: {
    padding: "0.75rem 1rem",
    borderRadius: "16px",
    fontSize: "0.9375rem",
    color: "#ffffff",
    lineHeight: 1.4,
    wordBreak: "break-word" as const,
  },
  typingIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 1rem",
    fontSize: "0.8125rem",
    color: "#737373",
  },
  typingDots: {
    display: "flex",
    gap: "3px",
  },
  typingDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#6366f1",
    animation: "bounce 1s infinite",
  },
  typingText: {
    fontStyle: "italic",
  },
  inputArea: {
    display: "flex",
    gap: "0.75rem",
    padding: "1rem",
    borderTop: "1px solid #262626",
    background: "#1a1a1a",
  },
  input: {
    flex: 1,
    padding: "0.75rem 1rem",
    fontSize: "0.9375rem",
    background: "#262626",
    border: "1px solid #333",
    borderRadius: "12px",
    color: "#ffffff",
    outline: "none",
    transition: "border-color 0.2s ease",
  },
  sendButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "44px",
    height: "44px",
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    border: "none",
    borderRadius: "12px",
    color: "#ffffff",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
};

// Inject bounce animation
const chatStyles = `
  @keyframes bounce {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-4px); }
  }
`;

if (typeof document !== "undefined") {
  const styleEl = document.createElement("style");
  styleEl.textContent = chatStyles;
  document.head.appendChild(styleEl);
}
