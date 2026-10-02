import { api } from "./api";
import type { DailyReport, DailyReportCreate, DailyReportUpdate } from "@/types/dailyReport";
import type { DailyWorkOverride } from "@/types/dailyWorkOverride";

export const dailyReportService = {
  submit: (payload: DailyReportCreate) => api.post<DailyReport>("/daily-reports", payload).then((r) => r.data),
  update: (id: string, payload: DailyReportUpdate) =>
    api.put<DailyReport>(`/daily-reports/${id}`, payload).then((r) => r.data),
  today: () => api.get<DailyReport | null>("/daily-reports/me/today").then((r) => r.data),
  myReports: (limit = 60) => api.get<DailyReport[]>("/daily-reports/me", { params: { limit } }).then((r) => r.data),
  list: (params: { date_from?: string; date_to?: string; employee_id?: string; department_id?: string; status?: string }) =>
    api.get<DailyReport[]>("/daily-reports", { params }).then((r) => r.data),
  comment: (id: string, comment: string) =>
    api.post<DailyReport>(`/daily-reports/${id}/comment`, { comment }).then((r) => r.data),

  // Daily-Work-Before-Logout policy: admin override
  grantLogoutOverride: (employeeId: string, payload: { override_date?: string; reason?: string }) =>
    api.post<DailyWorkOverride>(`/daily-reports/logout-override/${employeeId}`, payload).then((r) => r.data),
  listLogoutOverrides: (employeeId: string) =>
    api.get<DailyWorkOverride[]>(`/daily-reports/logout-override/${employeeId}`).then((r) => r.data),
};
