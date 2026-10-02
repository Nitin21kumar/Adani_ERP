import { api } from "./api";
import type { ProfileChangeRequest, ProfileChangeRequestCreate } from "@/types/profileChangeRequest";

export const profileChangeRequestService = {
  // Employee-facing
  submit: (payload: ProfileChangeRequestCreate) =>
    api.post<ProfileChangeRequest>("/profile/me/change-request", payload).then((r) => r.data),
  myLatest: () => api.get<ProfileChangeRequest | null>("/profile/me/change-request").then((r) => r.data),

  // Admin/HR-facing
  list: (status?: string) =>
    api.get<ProfileChangeRequest[]>("/profile/change-requests", { params: { status } }).then((r) => r.data),
  approve: (id: string, comment?: string) =>
    api.post<ProfileChangeRequest>(`/profile/change-requests/${id}/approve`, { comment }).then((r) => r.data),
  reject: (id: string, comment?: string) =>
    api.post<ProfileChangeRequest>(`/profile/change-requests/${id}/reject`, { comment }).then((r) => r.data),
};
