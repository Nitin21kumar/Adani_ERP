export interface DashboardSummary {
  total_employees: number;
  present_today: number;
  absent_today: number;
  late_today: number;
  on_leave_today: number;
  wfh_today: number;
  pending_leave_count: number;
  pending_reports_count: number;
  attendance_trend: { date: string; present: number; absent: number; late: number }[];
  department_distribution: { name: string; value: number }[];
  monthly_leave_trend: { month: string; leaves: number }[];
}
