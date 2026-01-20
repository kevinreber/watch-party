import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function useNotifications(limit?: number) {
  const notifications = useQuery(api.notifications.getNotifications, { limit });
  const unreadCount = useQuery(api.notifications.getUnreadCount);

  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const deleteNotification = useMutation(api.notifications.deleteNotification);
  const clearAllNotifications = useMutation(
    api.notifications.clearAllNotifications
  );

  return {
    notifications: notifications || [],
    unreadCount: unreadCount || 0,
    isLoading: notifications === undefined,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  };
}
