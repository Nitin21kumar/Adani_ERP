export * from "./auth";

export interface ApiError {
  detail: string;
}

export interface DashboardCard {
  label: string;
  value: string | number;
  icon?: string;
  trend?: number;
}
