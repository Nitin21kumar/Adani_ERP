import { api } from "./api";
import type { CompanyPublic, CompanySettings, CompanySettingsUpdate, Holiday, HolidayCreate } from "@/types/settings";
import type { DatabaseAuditReport } from "@/types/dbAudit";

export const settingsService = {
  // No-auth endpoint — safe to call before login (e.g. from the Login page).
  getPublic: () => api.get<CompanyPublic>("/settings/public").then((r) => r.data),
  getCompany: () => api.get<CompanySettings>("/settings/company").then((r) => r.data),
  updateCompany: (payload: CompanySettingsUpdate) =>
    api.put<CompanySettings>("/settings/company", payload).then((r) => r.data),
  listHolidays: (year?: number) =>
    api.get<Holiday[]>("/settings/holidays", { params: { year } }).then((r) => r.data),
  createHoliday: (payload: HolidayCreate) => api.post<Holiday>("/settings/holidays", payload).then((r) => r.data),
  deleteHoliday: (id: string) => api.delete(`/settings/holidays/${id}`).then((r) => r.data),
  runTempImageCleanup: () =>
    api
      .post<{ checked: number; deleted: number; skipped_protected: number; errors: number; max_age_days: number }>(
        "/settings/cleanup-temp-images"
      )
      .then((r) => r.data),
  getDatabaseAudit: () => api.get("/settings/db-audit").then((r) => r.data as DatabaseAuditReport),
};
