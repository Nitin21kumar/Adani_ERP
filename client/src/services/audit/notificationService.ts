import { auditApi } from "./api";
import type { AuditNotification } from "@/types/audit";

export const auditNotificationService = {
  list: (unreadOnly = false) =>
    auditApi.get<{ items: AuditNotification[]; unreadCount: number }>("/notifications", { params: { unreadOnly } }).then((r) => r.data),
  markRead: (id: string) => auditApi.post(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => auditApi.post("/notifications/read-all").then((r) => r.data),
};
