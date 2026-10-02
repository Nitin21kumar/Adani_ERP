export interface DailyWorkOverride {
  id: string;
  employee_id: string;
  override_date: string;
  granted_by: string;
  reason: string | null;
  created_at: string;
}
