import type { Role } from "./auth";

export interface Department {
  id: string;
  name: string;
  description: string | null;
  head_employee_id: string | null;
  employee_count: number;
}

export interface ManagerBrief {
  id: string;
  full_name: string;
}

export interface Employee {
  id: string;
  user_id: string;
  employee_code: string;
  full_name: string;
  phone: string | null;
  photo_url: string | null;
  designation: string | null;
  joining_date: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  department: Department | null;
  manager: ManagerBrief | null;
  email: string;
  status: "active" | "blocked" | "pending";
  role: Role;
  is_deleted: boolean;
  created_at: string;
}

export interface EmployeeCreate {
  email: string;
  full_name: string;
  role_id: string;
  employee_code?: string;
  department_id?: string;
  manager_id?: string;
  designation?: string;
  joining_date?: string;
  phone?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

export interface EmployeeUpdate extends Partial<Omit<EmployeeCreate, "email">> {}

export interface EmployeeCreateResponse {
  employee: Employee;
  temporary_password: string;
}
