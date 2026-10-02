import { auditApi } from "./api";
import type { ConditionRating } from "@/types/audit";

export const conditionRatingService = {
  list: (params: { active?: boolean } = {}) => auditApi.get<ConditionRating[]>("/condition-ratings", { params }).then((r) => r.data),
  create: (payload: Omit<ConditionRating, "id">) => auditApi.post<ConditionRating>("/condition-ratings", payload).then((r) => r.data),
  update: (id: string, payload: Partial<Pick<ConditionRating, "valuationPercentage" | "active">>) =>
    auditApi.patch<ConditionRating>(`/condition-ratings/${id}`, payload).then((r) => r.data),
};
