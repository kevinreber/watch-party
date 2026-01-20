// Notification Service
import type { Notification } from "~/types";
import { storage, STORAGE_KEYS } from "~/utils/storage";

// Generate a unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const notificationService = {
  // Get all notifications
  getNotifications(): Notification[] {
    return storage.get<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  },

  // Get unread notifications
  getUnreadNotifications(): Notification[] {
    return notificationService.getNotifications().filter(n => !n.read);
  },

  // Get unread count
  getUnreadCount(): number {
    return notificationService.getUnreadNotifications().length;
  },

  // Add a notification
  addNotification(
    type: Notification["type"],
    title: string,
    message: string,
    data?: Record<string, unknown>
  ): Notification {
    const notifications = notificationService.getNotifications();
    const newNotification: Notification = {
      id: generateId(),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      data,
    };

    // Add to beginning
    notifications.unshift(newNotification);

    // Keep only last 50 notifications
    const trimmed = notifications.slice(0, 50);
    storage.set(STORAGE_KEYS.NOTIFICATIONS, trimmed);

    // Trigger browser notification if supported
    notificationService.showBrowserNotification(title, message);

    return newNotification;
  },

  // Mark notification as read
  markAsRead(notificationId: string): void {
    const notifications = notificationService.getNotifications();
    const notifIndex = notifications.findIndex(n => n.id === notificationId);

    if (notifIndex !== -1) {
      notifications[notifIndex].read = true;
      storage.set(STORAGE_KEYS.NOTIFICATIONS, notifications);
    }
  },

  // Mark all as read
  markAllAsRead(): void {
    const notifications = notificationService.getNotifications();
    notifications.forEach(n => n.read = true);
    storage.set(STORAGE_KEYS.NOTIFICATIONS, notifications);
  },

  // Delete a notification
  deleteNotification(notificationId: string): void {
    const notifications = notificationService.getNotifications();
    const filtered = notifications.filter(n => n.id !== notificationId);
    storage.set(STORAGE_KEYS.NOTIFICATIONS, filtered);
  },

  // Clear all notifications
  clearAllNotifications(): void {
    storage.set(STORAGE_KEYS.NOTIFICATIONS, []);
  },

  // Request browser notification permission
  async requestPermission(): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    return false;
  },

  // Show browser notification
  showBrowserNotification(title: string, body: string): void {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
      });
    }
  },

  // Helper methods for specific notification types
  notifyFriendRequest(fromUsername: string): Notification {
    return notificationService.addNotification(
      "friend_request",
      "New Friend Request",
      `${fromUsername} wants to be your friend`,
      { fromUsername }
    );
  },

  notifyPartyInvite(partyName: string, fromUsername: string, roomId: string): Notification {
    return notificationService.addNotification(
      "party_invite",
      "Party Invitation",
      `${fromUsername} invited you to "${partyName}"`,
      { partyName, fromUsername, roomId }
    );
  },

  notifyPartyStarting(partyName: string, roomId: string): Notification {
    return notificationService.addNotification(
      "party_starting",
      "Party Starting Soon",
      `"${partyName}" is starting in 15 minutes!`,
      { partyName, roomId }
    );
  },

  notifyFriendOnline(friendUsername: string): Notification {
    return notificationService.addNotification(
      "friend_online",
      "Friend Online",
      `${friendUsername} is now online`,
      { friendUsername }
    );
  },
};
