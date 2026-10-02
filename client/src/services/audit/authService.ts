import { auditApi } from "./api";
import type { AuditLoginPayload, AuditTokenResponse, AuditUser } from "@/types/audit";

export const auditAuthService = {
  login: (payload: AuditLoginPayload) => auditApi.post<AuditTokenResponse>("/auth/login", payload).then((r) => r.data),
  me: () => auditApi.get<AuditUser>("/auth/me").then((r) => r.data),
};
