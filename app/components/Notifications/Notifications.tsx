import { useState, useEffect, type CSSProperties } from "react";
import type { Notification as NotificationType } from "~/types";
import { notificationService } from "~/services/notificationService";

interface NotificationsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Notifications({ isOpen, onClose }: NotificationsProps) {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);

  useEffect(() => {
    if (isOpen) {
      setNotifications(notificationService.getNotifications());
    }
  }, [isOpen]);

  const handleMarkAsRead = (notificationId: string) => {
    notificationService.markAsRead(notificationId);
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleDelete = (notificationId: string) => {
    notificationService.deleteNotification(notificationId);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleClearAll = () => {
    notificationService.clearAllNotifications();
    setNotifications([]);
  };

  const getIcon = (type: NotificationType["type"]) => {
    switch (type) {
      case "friend_request": return "👋";
      case "party_invite": return "🎉";
      case "party_starting": return "⏰";
      case "friend_online": return "🟢";
      default: return "🔔";
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.round(diff / 3600000)}h ago`;
    return `${Math.round(diff / 86400000)}d ago`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose} data-testid="notifications">
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <h2 style={styles.title}>Notifications</h2>
            {unreadCount > 0 && (
              <span style={styles.unreadBadge}>{unreadCount}</span>
            )}
          </div>
          <button onClick={onClose} style={styles.closeButton}>✕</button>
        </div>

        {notifications.length > 0 && (
          <div style={styles.actions}>
            <button onClick={handleMarkAllAsRead} style={styles.actionButton}>
              Mark all as read
            </button>
            <button onClick={handleClearAll} style={styles.actionButton}>
              Clear all
            </button>
          </div>
        )}

        <div style={styles.content}>
          {notifications.length === 0 ? (
            <div style={styles.empty}>
              <span style={styles.emptyIcon}>🔔</span>
              <p style={styles.emptyText}>No notifications yet</p>
            </div>
          ) : (
            <div style={styles.list}>
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  style={{
                    ...styles.notificationCard,
                    ...(notification.read ? {} : styles.unreadCard),
                  }}
                  onClick={() => handleMarkAsRead(notification.id)}
                  data-testid={`notification-${notification.id}`}
                >
                  <div style={styles.notificationIcon}>
                    {getIcon(notification.type)}
                  </div>
                  <div style={styles.notificationContent}>
                    <span style={styles.notificationTitle}>{notification.title}</span>
                    <span style={styles.notificationMessage}>{notification.message}</span>
                    <span style={styles.notificationTime}>
                      {formatTime(notification.timestamp)}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notification.id);
                    }}
                    style={styles.deleteButton}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Notification Bell component for header
export function NotificationBell({ onClick }: { onClick: () => void }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setUnreadCount(notificationService.getUnreadCount());

    // Poll for new notifications
    const interval = setInterval(() => {
      setUnreadCount(notificationService.getUnreadCount());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <button onClick={onClick} style={bellStyles.button} data-testid="notification-bell">
      🔔
      {unreadCount > 0 && (
        <span style={bellStyles.badge}>{unreadCount > 9 ? "9+" : unreadCount}</span>
      )}
    </button>
  );
}

const styles: Record<string, CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.8)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "flex-end",
    padding: "1rem",
    zIndex: 1000,
  },
  panel: {
    width: "100%",
    maxWidth: "380px",
    maxHeight: "calc(100vh - 2rem)",
    background: "#1a1a1a",
    borderRadius: "16px",
    border: "1px solid #333",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    marginTop: "60px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem 1.5rem",
    borderBottom: "1px solid #333",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  title: {
    margin: 0,
    fontSize: "1.125rem",
    fontWeight: 600,
    color: "#ffffff",
  },
  unreadBadge: {
    padding: "0.125rem 0.5rem",
    background: "#ef4444",
    borderRadius: "100px",
    fontSize: "0.75rem",
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
  actions: {
    display: "flex",
    gap: "0.5rem",
    padding: "0.75rem 1rem",
    borderBottom: "1px solid #333",
  },
  actionButton: {
    padding: "0.5rem 0.75rem",
    background: "transparent",
    border: "1px solid #404040",
    borderRadius: "6px",
    color: "#a3a3a3",
    fontSize: "0.75rem",
    cursor: "pointer",
  },
  content: {
    flex: 1,
    overflowY: "auto",
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "3rem 1rem",
  },
  emptyIcon: {
    fontSize: "2rem",
    marginBottom: "0.5rem",
    opacity: 0.5,
  },
  emptyText: {
    color: "#737373",
    fontSize: "0.875rem",
  },
  list: {
    display: "flex",
    flexDirection: "column",
  },
  notificationCard: {
    display: "flex",
    gap: "0.75rem",
    padding: "1rem",
    borderBottom: "1px solid #262626",
    cursor: "pointer",
    transition: "background 0.2s ease",
  },
  unreadCard: {
    background: "rgba(99, 102, 241, 0.1)",
  },
  notificationIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#262626",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1rem",
    flexShrink: 0,
  },
  notificationContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  notificationTitle: {
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#ffffff",
  },
  notificationMessage: {
    fontSize: "0.75rem",
    color: "#a3a3a3",
    marginTop: "0.125rem",
  },
  notificationTime: {
    fontSize: "0.75rem",
    color: "#737373",
    marginTop: "0.25rem",
  },
  deleteButton: {
    width: "24px",
    height: "24px",
    border: "none",
    background: "transparent",
    color: "#737373",
    cursor: "pointer",
    fontSize: "0.75rem",
    opacity: 0.5,
    alignSelf: "flex-start",
  },
};

const bellStyles: Record<string, CSSProperties> = {
  button: {
    position: "relative",
    width: "36px",
    height: "36px",
    border: "none",
    background: "#262626",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
  },
  badge: {
    position: "absolute",
    top: "-4px",
    right: "-4px",
    minWidth: "18px",
    height: "18px",
    padding: "0 4px",
    background: "#ef4444",
    borderRadius: "100px",
    fontSize: "0.625rem",
    fontWeight: 600,
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
