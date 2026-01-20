import { useState, useEffect, type CSSProperties } from "react";
import type { Friend, FriendRequest } from "~/types";
import { friendsService } from "~/services/friendsService";

interface FriendsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onInviteToRoom?: (friendId: string) => void;
  currentRoomId?: string;
}

export function FriendsPanel({ isOpen, onClose, onInviteToRoom, currentRoomId }: FriendsPanelProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{id: string; username: string; avatar: string; avatarColor: string}>>([]);
  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "search">("friends");

  // Load friends and requests
  useEffect(() => {
    if (isOpen) {
      setFriends(friendsService.getFriends());
      setPendingRequests(friendsService.getPendingRequests());
    }
  }, [isOpen]);

  // Search users
  useEffect(() => {
    if (searchQuery.length >= 2) {
      friendsService.searchUsers(searchQuery).then(setSearchResults);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleAcceptRequest = (requestId: string) => {
    friendsService.acceptFriendRequest(requestId);
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    setFriends(friendsService.getFriends());
  };

  const handleRejectRequest = (requestId: string) => {
    friendsService.rejectFriendRequest(requestId);
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));
  };

  const handleRemoveFriend = (friendId: string) => {
    friendsService.removeFriend(friendId);
    setFriends(prev => prev.filter(f => f.id !== friendId));
  };

  const handleSendRequest = (userId: string) => {
    friendsService.sendFriendRequest(userId);
    // For demo, directly add as friend
    const user = searchResults.find(u => u.id === userId);
    if (user) {
      friendsService.addFriend(user);
      setFriends(friendsService.getFriends());
    }
    setSearchResults(prev => prev.filter(u => u.id !== userId));
  };

  const getStatusColor = (status: Friend["status"]) => {
    switch (status) {
      case "online": return "#22c55e";
      case "in-room": return "#6366f1";
      default: return "#737373";
    }
  };

  const getStatusText = (friend: Friend) => {
    switch (friend.status) {
      case "online": return "Online";
      case "in-room": return `In ${friend.currentRoom || "a room"}`;
      default: return "Offline";
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose} data-testid="friends-panel">
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Friends</h2>
          <button onClick={onClose} style={styles.closeButton}>✕</button>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button
            onClick={() => setActiveTab("friends")}
            style={{
              ...styles.tab,
              ...(activeTab === "friends" ? styles.tabActive : {}),
            }}
          >
            Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            style={{
              ...styles.tab,
              ...(activeTab === "requests" ? styles.tabActive : {}),
            }}
          >
            Requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
          </button>
          <button
            onClick={() => setActiveTab("search")}
            style={{
              ...styles.tab,
              ...(activeTab === "search" ? styles.tabActive : {}),
            }}
          >
            Search
          </button>
        </div>

        <div style={styles.content}>
          {/* Friends List */}
          {activeTab === "friends" && (
            <div style={styles.list}>
              {friends.length === 0 ? (
                <p style={styles.emptyText}>No friends yet. Search to add some!</p>
              ) : (
                friends.map(friend => (
                  <div key={friend.id} style={styles.friendCard} data-testid={`friend-${friend.id}`}>
                    <div
                      style={{
                        ...styles.friendAvatar,
                        backgroundColor: friend.avatarColor,
                      }}
                    >
                      {friend.avatar}
                      <span
                        style={{
                          ...styles.statusDot,
                          backgroundColor: getStatusColor(friend.status),
                        }}
                      />
                    </div>
                    <div style={styles.friendInfo}>
                      <span style={styles.friendName}>{friend.username}</span>
                      <span style={styles.friendStatus}>{getStatusText(friend)}</span>
                    </div>
                    <div style={styles.friendActions}>
                      {currentRoomId && friend.status !== "offline" && onInviteToRoom && (
                        <button
                          onClick={() => onInviteToRoom(friend.id)}
                          style={styles.inviteButton}
                          title="Invite to room"
                        >
                          📨
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveFriend(friend.id)}
                        style={styles.removeButton}
                        title="Remove friend"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Pending Requests */}
          {activeTab === "requests" && (
            <div style={styles.list}>
              {pendingRequests.length === 0 ? (
                <p style={styles.emptyText}>No pending requests</p>
              ) : (
                pendingRequests.map(request => (
                  <div key={request.id} style={styles.requestCard}>
                    <div style={styles.requestAvatar}>
                      {request.fromAvatar}
                    </div>
                    <div style={styles.requestInfo}>
                      <span style={styles.requestName}>{request.fromUsername}</span>
                      <span style={styles.requestTime}>Wants to be friends</span>
                    </div>
                    <div style={styles.requestActions}>
                      <button
                        onClick={() => handleAcceptRequest(request.id)}
                        style={styles.acceptButton}
                        data-testid={`accept-${request.id}`}
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.id)}
                        style={styles.rejectButton}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Search Users */}
          {activeTab === "search" && (
            <div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                style={styles.searchInput}
                data-testid="friend-search-input"
              />
              <div style={styles.list}>
                {searchResults.map(user => (
                  <div key={user.id} style={styles.searchResult}>
                    <div
                      style={{
                        ...styles.searchAvatar,
                        backgroundColor: user.avatarColor,
                      }}
                    >
                      {user.avatar}
                    </div>
                    <span style={styles.searchName}>{user.username}</span>
                    <button
                      onClick={() => handleSendRequest(user.id)}
                      style={styles.addButton}
                      data-testid={`add-${user.id}`}
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
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
  panel: {
    width: "100%",
    maxWidth: "400px",
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
  tabs: {
    display: "flex",
    borderBottom: "1px solid #333",
  },
  tab: {
    flex: 1,
    padding: "0.75rem",
    background: "transparent",
    border: "none",
    color: "#a3a3a3",
    fontSize: "0.875rem",
    cursor: "pointer",
    borderBottom: "2px solid transparent",
  },
  tabActive: {
    color: "#ffffff",
    borderBottomColor: "#6366f1",
  },
  content: {
    flex: 1,
    overflowY: "auto",
    padding: "1rem",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  emptyText: {
    color: "#737373",
    textAlign: "center",
    padding: "2rem",
    fontSize: "0.875rem",
  },
  friendCard: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.75rem",
    background: "#262626",
    borderRadius: "8px",
  },
  friendAvatar: {
    position: "relative",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1rem",
    fontWeight: 600,
    color: "#ffffff",
  },
  statusDot: {
    position: "absolute",
    bottom: "0",
    right: "0",
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    border: "2px solid #262626",
  },
  friendInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  friendName: {
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#ffffff",
  },
  friendStatus: {
    fontSize: "0.75rem",
    color: "#a3a3a3",
  },
  friendActions: {
    display: "flex",
    gap: "0.5rem",
  },
  inviteButton: {
    width: "32px",
    height: "32px",
    border: "none",
    background: "#6366f1",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
  },
  removeButton: {
    width: "32px",
    height: "32px",
    border: "none",
    background: "#404040",
    borderRadius: "6px",
    color: "#a3a3a3",
    cursor: "pointer",
  },
  requestCard: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.75rem",
    background: "#262626",
    borderRadius: "8px",
  },
  requestAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "#6366f1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1rem",
    fontWeight: 600,
    color: "#ffffff",
  },
  requestInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  requestName: {
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#ffffff",
  },
  requestTime: {
    fontSize: "0.75rem",
    color: "#a3a3a3",
  },
  requestActions: {
    display: "flex",
    gap: "0.5rem",
  },
  acceptButton: {
    width: "32px",
    height: "32px",
    border: "none",
    background: "#22c55e",
    borderRadius: "6px",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 600,
  },
  rejectButton: {
    width: "32px",
    height: "32px",
    border: "none",
    background: "#ef4444",
    borderRadius: "6px",
    color: "#ffffff",
    cursor: "pointer",
  },
  searchInput: {
    width: "100%",
    padding: "0.75rem",
    background: "#262626",
    border: "1px solid #404040",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "0.875rem",
    marginBottom: "1rem",
    outline: "none",
  },
  searchResult: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.75rem",
    background: "#262626",
    borderRadius: "8px",
  },
  searchAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1rem",
    fontWeight: 600,
    color: "#ffffff",
  },
  searchName: {
    flex: 1,
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#ffffff",
  },
  addButton: {
    padding: "0.5rem 1rem",
    background: "#6366f1",
    border: "none",
    borderRadius: "6px",
    color: "#ffffff",
    fontSize: "0.75rem",
    fontWeight: 500,
    cursor: "pointer",
  },
};
