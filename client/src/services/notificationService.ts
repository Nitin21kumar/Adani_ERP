import { api } from "./api";
import type { Notification } from "@/types/notification";

export const notificationService = {
  myNotifications: (limit = 50) =>
    api.get<Notification[]>("/notifications/me", { params: { limit } }).then((r) => r.data),
  markRead: (id: string) => api.post<Notification>(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.post<{ marked_read: number }>("/notifications/read-all").then((r) => r.data),
};
