import { useState } from "react";
import type { RealtimeChannel } from "ably";
import { useHandleMessagesAbly } from "~/hooks";
import type { PresenceUser } from "~/hooks/useGetUserCountAbly";
import { WatchList } from "../WatchList/WatchList";
import { ChatList } from "../ChatList/ChatList";

interface Video {
  videoId: string;
  url: string;
  name: string;
  channel?: string;
  description?: string;
  img?: string;
}

interface SidePanelProps {
  videos: Video[];
  removeVideoFromList: (video: Video) => void;
  channel: RealtimeChannel | null;
  clientId: string | undefined;
  usersCount: number;
  users: PresenceUser[];
  user: string;
}

type TabType = "queue" | "chat";

export const SidePanel = ({
  videos,
  removeVideoFromList,
  channel,
  clientId,
  usersCount,
  users,
  user,
}: SidePanelProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("queue");
  const { messages, sendMessage, userIsTyping, isTypingMessage, emitTyping, emitStopTyping } =
    useHandleMessagesAbly(channel, user, clientId);

  return (
    <div style={styles.container}>
      {/* Header with tabs */}
      <div style={styles.header}>
        <div style={styles.tabs}>
          <button
            onClick={() => setActiveTab("queue")}
            style={{
              ...styles.tab,
              ...(activeTab === "queue" ? styles.tabActive : {}),
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M2 4H16M2 9H16M2 14H10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Queue
            {videos.length > 0 && (
              <span style={styles.tabBadge}>{videos.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            style={{
              ...styles.tab,
              ...(activeTab === "chat" ? styles.tabActive : {}),
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M15 11.5C15 11.942 14.8244 12.366 14.5118 12.6785C14.1993 12.991 13.7754 13.1667 13.3333 13.1667H6.33333L3 16.5V4.83333C3 4.39131 3.17559 3.96738 3.48816 3.65482C3.80072 3.34226 4.22464 3.16667 4.66667 3.16667H13.3333C13.7754 3.16667 14.1993 3.34226 14.5118 3.65482C14.8244 3.96738 15 4.39131 15 4.83333V11.5Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Chat
            {messages.length > 0 && (
              <span style={styles.tabBadge}>{messages.length}</span>
            )}
          </button>
        </div>

        {/* Users watching */}
        <div style={styles.userCount}>
          <div style={styles.userCountDot} />
          <div style={styles.viewerAvatars}>
            {users.slice(0, 3).map((viewer, index) => (
              <div
                key={viewer.clientId}
                style={{
                  ...styles.viewerAvatar,
                  marginLeft: index === 0 ? 0 : -8,
                  zIndex: users.length - index,
                  backgroundColor: viewer.avatarColor,
                }}
                title={viewer.username}
              >
                {viewer.avatar ? (
                  <img
                    src={viewer.avatar}
                    alt={viewer.username}
                    style={styles.viewerAvatarImg}
                  />
                ) : (
                  viewer.username.charAt(0).toUpperCase()
                )}
              </div>
            ))}
            {usersCount > 3 && (
              <div
                style={{
                  ...styles.viewerAvatar,
                  ...styles.viewerAvatarMore,
                  marginLeft: -8,
                  zIndex: 0,
                }}
              >
                +{usersCount - 3}
              </div>
            )}
          </div>
          <span>{usersCount} watching</span>
        </div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {activeTab === "queue" && (
          <WatchList videos={videos} removeVideo={removeVideoFromList} />
        )}
        {activeTab === "chat" && (
          <ChatList
            messages={messages}
            sendMessage={sendMessage}
            userIsTyping={userIsTyping}
            isTypingMessage={isTypingMessage}
            user={user}
            onTyping={emitTyping}
            onStopTyping={emitStopTyping}
          />
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: "#1a1a1a",
    borderLeft: "1px solid #262626",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.75rem 1rem",
    borderBottom: "1px solid #262626",
    gap: "0.75rem",
  },
  tabs: {
    display: "flex",
    gap: "0.25rem",
    background: "#262626",
    padding: "4px",
    borderRadius: "10px",
  },
  tab: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 1rem",
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#737373",
    background: "transparent",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  tabActive: {
    color: "#ffffff",
    background: "#333",
  },
  tabBadge: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "20px",
    height: "20px",
    padding: "0 6px",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "#ffffff",
    background: "#6366f1",
    borderRadius: "100px",
  },
  userCount: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.8125rem",
    color: "#a3a3a3",
  },
  userCountDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#22c55e",
    boxShadow: "0 0 8px rgba(34, 197, 94, 0.5)",
  },
  viewerAvatars: {
    display: "flex",
    alignItems: "center",
  },
  viewerAvatar: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.625rem",
    fontWeight: 600,
    color: "#ffffff",
    border: "2px solid #1a1a1a",
    overflow: "hidden",
    position: "relative" as const,
  },
  viewerAvatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  },
  viewerAvatarMore: {
    backgroundColor: "#404040",
    fontSize: "0.5rem",
  },
  content: {
    flex: 1,
    overflow: "hidden",
  },
};
