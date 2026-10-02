import type { EmployeeBrief } from "./attendance";
import type { RequestStatus } from "./leave";

export interface WFHRequest {
  id: string;
  employee_id: string;
  reason: string;
  expected_work: string;
  from_date: string;
  to_date: string;
  attachment_url: string | null;
  status: RequestStatus;
  review_comment: string | null;
  created_at: string;
  employee?: EmployeeBrief | null;
}

export interface WFHRequestCreate {
  reason: string;
  expected_work: string;
  from_date: string;
  to_date: string;
  attachment_url?: string | null;
}
