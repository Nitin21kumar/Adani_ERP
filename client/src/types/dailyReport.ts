import type { EmployeeBrief } from "./attendance";

export type ReportPriority = "low" | "medium" | "high";
export type ReportStatus = "draft" | "submitted" | "reviewed";

export interface DailyReport {
  id: string;
  employee_id: string;
  report_date: string;
  title: string;
  project: string | null;
  task_description: string;
  hours_worked: number;
  priority: ReportPriority;
  attachment_url: string | null;
  status: ReportStatus;
  admin_comments: string | null;
  created_at: string;
  employee?: EmployeeBrief | null;
}

export interface DailyReportCreate {
  task_description: string;
  title?: string;
  project?: string;
  hours_worked?: number;
  priority?: ReportPriority;
  attachment_url?: string | null;
}

export interface DailyReportUpdate extends Partial<DailyReportCreate> {}
