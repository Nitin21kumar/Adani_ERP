import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { TokenResponse } from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ---- Token storage helpers ----
// "Remember me" decides whether tokens live in localStorage (persists across
// browser restarts) or sessionStorage (cleared when the tab closes) — this is
// how the "Session Timeout" / "Remember Me" requirement is implemented client-side.
const ACCESS_KEY = "erp_access_token";
const REFRESH_KEY = "erp_refresh_token";

function getStorage(): Storage {
  return localStorage.getItem(REFRESH_KEY) ? localStorage : sessionStorage;
}

export function storeTokens(tokens: TokenResponse, rememberMe: boolean) {
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(ACCESS_KEY, tokens.access_token);
  storage.setItem(REFRESH_KEY, tokens.refresh_token);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY) || sessionStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY) || sessionStorage.getItem(REFRESH_KEY);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
}

// ---- Request interceptor: attach access token ----
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Response interceptor: auto-refresh on 401 ----
let isRefreshing = false;
let pendingQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // /auth/login and /auth/refresh are not authenticated requests — a 401
    // from them means "wrong credentials" / "expired refresh token", not
    // "our access token expired". Letting the refresh-and-retry logic below
    // run for these was hijacking a failed login: it would redirect to
    // /login (or retry with a stale refresh token) before the caller's
    // catch block ever got to show the real error message.
    const isAuthEndpoint = originalRequest?.url?.includes("/auth/login") || originalRequest?.url?.includes("/auth/refresh");

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // queue subsequent requests until refresh completes
        return new Promise((resolve) => {
          pendingQueue.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post<TokenResponse>(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });
        const rememberMe = !!localStorage.getItem(REFRESH_KEY);
        storeTokens(data, rememberMe);
        pendingQueue.forEach((cb) => cb(data.access_token));
        pendingQueue = [];
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearTokens();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
