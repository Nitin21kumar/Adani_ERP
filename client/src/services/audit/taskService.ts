import { auditApi } from "./api";
import type { AuditTask, Paginated } from "@/types/audit";

export const auditTaskService = {
  list: (params: { status?: string; auditor?: string; search?: string; limit?: number; skip?: number } = {}) =>
    auditApi.get<Paginated<AuditTask>>("/tasks", { params }).then((r) => r.data),
  create: (payload: { auditor: string; taskCode?: string; title?: string; notes?: string }) =>
    auditApi.post<AuditTask>("/tasks", payload).then((r) => r.data),
  update: (id: string, payload: Partial<{ auditor: string; status: string; title: string; notes: string }>) =>
    auditApi.patch<AuditTask>(`/tasks/${id}`, payload).then((r) => r.data),
  myTasks: (params: { status?: string; limit?: number; skip?: number } = {}) =>
    auditApi.get<Paginated<AuditTask>>("/my-tasks", { params }).then((r) => r.data),
  completeMyTask: (id: string) => auditApi.patch<AuditTask>(`/my-tasks/${id}/complete`).then((r) => r.data),
};
