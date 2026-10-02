import { api } from "./api";
import { downloadBlob, filenameFromDisposition } from "@/utils/download";

export type ReportType = "attendance" | "leave" | "daily-reports" | "employees" | "departments" | "monthly";
export type ExportFormat = "csv" | "excel" | "pdf";

export const reportService = {
  preview: (type: ReportType, params: Record<string, any>) =>
    api.get(`/reports/${type}`, { params: { ...params, format: "json" } }).then((r) => r.data as Record<string, any>[]),

  export: async (type: ReportType, format: ExportFormat, params: Record<string, any>) => {
    const response = await api.get(`/reports/${type}`, {
      params: { ...params, format },
      responseType: "blob",
    });
    const filename = filenameFromDisposition(response.headers["content-disposition"], `${type}_report.${format}`);
    downloadBlob(response.data, filename);
  },
};
