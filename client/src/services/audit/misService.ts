import { auditApi } from "./api";
import type { AssetVerification, Paginated } from "@/types/audit";

export const auditMisService = {
  pending: (params: { search?: string; limit?: number; skip?: number } = {}) =>
    auditApi.get<Paginated<AssetVerification>>("/mis/pending-verifications", { params }).then((r) => r.data),
  get: (id: string) => auditApi.get<AssetVerification>(`/mis/verifications/${id}`).then((r) => r.data),
  approve: (id: string, payload: { actualCost?: number; misRemarks?: string }) =>
    auditApi.post<AssetVerification>(`/mis/verifications/${id}/approve`, payload).then((r) => r.data),
  return: (id: string, misRemarks: string) =>
    auditApi.post<AssetVerification>(`/mis/verifications/${id}/return`, { misRemarks }).then((r) => r.data),
};
