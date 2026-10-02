import { auditApi } from "./api";
import type { AuditRole, AuditUser, Paginated } from "@/types/audit";

export interface CreateAuditUserPayload {
  name: string;
  email: string;
  password: string;
  role: AuditRole;
}

export const auditUserService = {
  list: (params: { role?: string; status?: string; search?: string; limit?: number; skip?: number } = {}) =>
    auditApi.get<Paginated<AuditUser>>("/users", { params }).then((r) => r.data),
  create: (payload: CreateAuditUserPayload) => auditApi.post<AuditUser>("/users", payload).then((r) => r.data),
  update: (id: string, payload: Partial<Pick<AuditUser, "name" | "role" | "status">> & { password?: string }) =>
    auditApi.patch<AuditUser>(`/users/${id}`, payload).then((r) => r.data),
};
