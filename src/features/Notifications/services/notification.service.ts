import { http } from "@/config/api";
import type { Notification } from "../types/notification.types";

export const notificationService = {
  // GET /api/Notifications/user/{userId}?unreadOnly=
  getByUser: async (
    userId: number,
    unreadOnly?: boolean,
  ): Promise<Notification[]> => {
    const { data } = await http.get<Notification[]>(
      `/Notifications/user/${userId}`,
      { params: unreadOnly ? { unreadOnly: true } : undefined },
    );
    return data;
  },

  // GET /api/Notifications/user/{userId}/unread-count
  getUnreadCount: async (userId: number): Promise<number> => {
    const { data } = await http.get<{ unreadCount: number }>(
      `/Notifications/user/${userId}/unread-count`,
    );
    return data.unreadCount;
  },

  // PATCH /api/Notifications/{id}/read
  markAsRead: async (id: number): Promise<Notification> => {
    const { data } = await http.patch<Notification>(
      `/Notifications/${id}/read`,
    );
    return data;
  },

  // PATCH /api/Notifications/user/{userId}/read-all
  markAllAsRead: async (userId: number): Promise<void> => {
    await http.patch(`/Notifications/user/${userId}/read-all`);
  },

  // DELETE /api/Notifications/{id}
  remove: async (id: number): Promise<void> => {
    await http.delete(`/Notifications/${id}`);
  },
};
