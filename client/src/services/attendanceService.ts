import { api } from "./api";
import type { Attendance, AttendanceFilters } from "@/types/attendance";

export const attendanceService = {
  login: (payload: {
    latitude: number;
    longitude: number;
    full_address?: string | null;
    browser?: string;
    os?: string;
    device?: string;
    verification_photo_url?: string | null;
    verification_photo_status?: string;
  }) => api.post<Attendance>("/attendance/login", payload).then((r) => r.data),

  logout: (payload: {
    latitude: number;
    longitude: number;
    full_address?: string | null;
    verification_photo_url?: string | null;
    verification_photo_status?: string;
    task_description?: string;
  }) => api.post<Attendance>("/attendance/logout", payload).then((r) => r.data),

  today: () => api.get<Attendance | null>("/attendance/me/today").then((r) => r.data),

  myHistory: (limit = 30) =>
    api.get<Attendance[]>("/attendance/me/history", { params: { limit } }).then((r) => r.data),

  list: (filters: AttendanceFilters) =>
    api.get<Attendance[]>("/attendance", { params: filters }).then((r) => r.data),
};
