export interface CompanySettings {
  id: string;
  company_name: string;
  logo_url: string | null;
  office_start_time: string | null; // "HH:MM:SS"
  office_end_time: string | null;
  late_grace_minutes: number;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_user: string | null;
  password_min_length: number;
  password_require_special_char: boolean;
  session_timeout_minutes: number;
  camera_verification_enabled: boolean;
}

export interface CompanySettingsUpdate extends Partial<Omit<CompanySettings, "id">> {}

/** Minimal, unauthenticated subset returned by GET /settings/public — used
 * on the login page and any other pre-auth screen. */
export interface CompanyPublic {
  company_name: string;
  logo_url: string | null;
  camera_verification_enabled: boolean;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  description: string | null;
  is_optional: boolean;
}

export interface HolidayCreate {
  name: string;
  date: string;
  description?: string;
  is_optional?: boolean;
}
