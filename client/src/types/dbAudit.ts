interface CountWithSample {
  count: number;
  sample_ids: string[];
}

interface DuplicateGroupReport {
  duplicate_groups: number;
  extra_rows: number;
  sample_groups: Record<string, unknown>[];
}

export interface DatabaseAuditReport {
  generated_at: string;
  orphaned_records: {
    leave_requests: CountWithSample;
    wfh_requests: CountWithSample;
    daily_reports: CountWithSample;
    documents: CountWithSample;
    attendance: CountWithSample;
    profile_photo_requests: CountWithSample;
    notifications: CountWithSample;
    login_history: CountWithSample;
  };
  duplicate_records: {
    attendance_same_employee_and_date: DuplicateGroupReport;
    daily_reports_same_employee_and_date: DuplicateGroupReport;
  };
  stale_records: {
    email_logs_older_than_180_days: number;
    password_resets_expired_or_used_older_than_30_days: number;
  };
  note: string;
}
