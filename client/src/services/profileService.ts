import { api } from "./api";
import type { Employee } from "@/types/employee";
import type { EmployeeDocument } from "@/types/document";

export const profileService = {
  me: () => api.get<Employee>("/profile/me").then((r) => r.data),
  updatePhoto: (photo_url: string) => api.put<Employee>("/profile/me/photo", { photo_url }).then((r) => r.data),
  documents: () => api.get<EmployeeDocument[]>("/profile/me/documents").then((r) => r.data),
  addDocument: (payload: { file_name: string; file_url: string; file_type?: string; doc_category?: string }) =>
    api.post<EmployeeDocument>("/profile/me/documents", payload).then((r) => r.data),
  removeDocument: (id: string) => api.delete(`/profile/me/documents/${id}`).then((r) => r.data),
};
