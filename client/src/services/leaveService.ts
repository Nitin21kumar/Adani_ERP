import { api } from "./api";
import type { LeaveRequest, LeaveRequestCreate } from "@/types/leave";

export const leaveService = {
  apply: (payload: LeaveRequestCreate) => api.post<LeaveRequest>("/leave", payload).then((r) => r.data),
  myRequests: () => api.get<LeaveRequest[]>("/leave/me").then((r) => r.data),
  list: (params: { status?: string; department_id?: string }) =>
    api.get<LeaveRequest[]>("/leave", { params }).then((r) => r.data),
  approve: (id: string, comment?: string) => api.post<LeaveRequest>(`/leave/${id}/approve`, { comment }).then((r) => r.data),
  reject: (id: string, comment?: string) => api.post<LeaveRequest>(`/leave/${id}/reject`, { comment }).then((r) => r.data),
};
