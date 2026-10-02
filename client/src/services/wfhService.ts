import { api } from "./api";
import type { WFHRequest, WFHRequestCreate } from "@/types/wfh";

export const wfhService = {
  apply: (payload: WFHRequestCreate) => api.post<WFHRequest>("/wfh", payload).then((r) => r.data),
  myRequests: () => api.get<WFHRequest[]>("/wfh/me").then((r) => r.data),
  list: (params: { status?: string; department_id?: string }) =>
    api.get<WFHRequest[]>("/wfh", { params }).then((r) => r.data),
  approve: (id: string, comment?: string) => api.post<WFHRequest>(`/wfh/${id}/approve`, { comment }).then((r) => r.data),
  reject: (id: string, comment?: string) => api.post<WFHRequest>(`/wfh/${id}/reject`, { comment }).then((r) => r.data),
};
