import { api } from "./api";
import type { DashboardSummary } from "@/types/dashboard";

export const reportsService = {
  dashboardSummary: () => api.get<DashboardSummary>("/reports/dashboard-summary").then((r) => r.data),
};
