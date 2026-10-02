import { api } from "./api";
import type { LoginPayload, TokenResponse, User } from "@/types";

export const authService = {
  login: (payload: LoginPayload) => api.post<TokenResponse>("/auth/login", payload).then((r) => r.data),

  me: () => api.get<User>("/auth/me").then((r) => r.data),

  forgotPassword: (identifier: string) => api.post("/auth/forgot-password", { identifier }).then((r) => r.data),

  resetPassword: (token: string, new_password: string) =>
    api.post("/auth/reset-password", { token, new_password }).then((r) => r.data),

  changePassword: (old_password: string, new_password: string) =>
    api.post("/auth/change-password", { old_password, new_password }).then((r) => r.data),

  logout: (location?: { latitude?: number; longitude?: number; full_address?: string }) =>
    api.post("/auth/logout", location ?? {}).then((r) => r.data),

  reportLoginVerificationPhoto: (payload: { photo_url: string | null; status: string }) =>
    api.post("/auth/login/verification-photo", payload).then((r) => r.data),

  adminResetPassword: (userId: string) =>
    api.post(`/auth/admin/reset-password/${userId}`).then((r) => r.data),
};
