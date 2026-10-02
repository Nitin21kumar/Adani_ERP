import { auditApi } from "./api";
import type { DamageCriteria, Paginated } from "@/types/audit";

export const damageCriteriaService = {
  list: (params: { category?: string; active?: boolean; limit?: number; skip?: number } = {}) =>
    auditApi.get<Paginated<DamageCriteria>>("/damage-criteria", { params }).then((r) => r.data),
  create: (payload: { name: string; category?: string; active?: boolean }) => auditApi.post<DamageCriteria>("/damage-criteria", payload).then((r) => r.data),
  update: (id: string, payload: Partial<Omit<DamageCriteria, "id">>) =>
    auditApi.patch<DamageCriteria>(`/damage-criteria/${id}`, payload).then((r) => r.data),
};
