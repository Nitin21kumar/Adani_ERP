export type RoleName = "super_admin" | "admin" | "hr" | "manager" | "employee";

export interface Role {
  id: string;
  name: RoleName;
}

export interface User {
  id: string;
  email: string;
  status: "active" | "blocked" | "pending";
  is_email_verified: boolean;
  role: Role;
  created_at: string;
}

export interface LoginPayload {
  username: string;
  password: string;
  remember_me: boolean;
  latitude?: number;
  longitude?: number;
  full_address?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
