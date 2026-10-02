import type { EmployeeBrief } from "./attendance";

export interface ProfileChangeRequest {
  id: string;
  employee_id: string;
  requested_phone: string | null;
  requested_address: string | null;
  requested_emergency_contact_name: string | null;
  requested_emergency_contact_phone: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  review_comment: string | null;
  created_at: string;
  employee?: EmployeeBrief | null;
}

export interface ProfileChangeRequestCreate {
  requested_phone?: string;
  requested_address?: string;
  requested_emergency_contact_name?: string;
  requested_emergency_contact_phone?: string;
}
