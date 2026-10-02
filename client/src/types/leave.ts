import type { EmployeeBrief } from "./attendance";

export type LeaveType = "casual" | "sick" | "earned" | "half_day" | "work_from_home";
export type RequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: LeaveType;
  reason: string;
  from_date: string;
  to_date: string;
  attachment_url: string | null;
  status: RequestStatus;
  review_comment: string | null;
  created_at: string;
  employee?: EmployeeBrief | null;
}

export interface LeaveRequestCreate {
  leave_type: LeaveType;
  reason: string;
  from_date: string;
  to_date: string;
  attachment_url?: string | null;
}
