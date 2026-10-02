import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

// Completely separate Axios instance + token storage key from the Employee
// ERP's client/src/services/api.ts — the Asset Audit Portal never reads or
// writes the employee `erp_access_token` and vice versa, so a session in one
// portal has no effect on the other, even in the same browser tab.
export const auditApi = axios.create({
  baseURL: `${API_BASE_URL}/audit`,
  headers: { "Content-Type": "application/json" },
});

const AUDIT_ACCESS_KEY = "audit_access_token";

export function storeAuditToken(token: string) {
  localStorage.setItem(AUDIT_ACCESS_KEY, token);
}

export function getAuditToken(): string | null {
  return localStorage.getItem(AUDIT_ACCESS_KEY);
}

export function clearAuditToken() {
  localStorage.removeItem(AUDIT_ACCESS_KEY);
}

auditApi.interceptors.request.use((config) => {
  const token = getAuditToken();
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// No refresh-token flow on the audit side (see server audit.tokens.js) — an
// expired/invalid access token simply sends the audit user back to their own
// login page, without touching the employee session in this tab.
auditApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes("/auth/login");
    if (error.response?.status === 401 && !isLoginRequest) {
      clearAuditToken();
      window.location.href = "/audit/login";
    }
    return Promise.reject(error);
  }
);
