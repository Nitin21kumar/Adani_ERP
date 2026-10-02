import { api } from "./api";

export const uploadService = {
  upload: async (file: File, folder: "attachments" | "company_logos" | "profile_photo_requests" | "login_verification_photos" | "attendance_verification_photos" = "attachments"): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post<{ url: string }>("/uploads", formData, {
      params: { folder },
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.url;
  },
};
