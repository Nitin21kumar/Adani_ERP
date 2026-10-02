export interface AttendanceLocation {
  id: string;
  event_type: "login" | "logout";
  latitude: number;
  longitude: number;
  full_address: string | null;
  captured_at: string;
}

export interface EmployeeBrief {
  id: string;
  full_name: string;
  employee_code: string;
  department_id: string | null;
}

export interface Attendance {
  id: string;
  employee_id: string;
  date: string;
  login_time: string | null;
  logout_time: string | null;
  working_hours: number | null;
  is_late: boolean;
  status: "present" | "absent" | "late" | "leave" | "wfh";
  browser: string | null;
  os: string | null;
  device: string | null;
  ip_address: string | null;
  login_verification_photo_url: string | null;
  login_verification_photo_status: string | null;
  logout_verification_photo_url: string | null;
  logout_verification_photo_status: string | null;
  locations: AttendanceLocation[];
  employee?: EmployeeBrief | null;
}

export interface AttendanceFilters {
  date_from?: string;
  date_to?: string;
  department_id?: string;
  employee_id?: string;
  status?: string;
}
