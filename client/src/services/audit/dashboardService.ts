import { auditApi } from "./api";
import type { DashboardSummary } from "@/types/audit";

export const auditDashboardService = {
  summary: () => auditApi.get<DashboardSummary>("/dashboard/summary").then((r) => r.data),
};
