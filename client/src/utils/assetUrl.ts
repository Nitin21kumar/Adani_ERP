/**
 * Resolves a possibly-relative asset URL (e.g. "/uploads/company_logos/xyz.png",
 * returned by local STORAGE_MODE) into an absolute URL pointing at the backend
 * origin, so it can be used directly in an <img src> anywhere in the app —
 * including the pre-auth Login page. S3/CDN URLs (already absolute) pass through
 * unchanged.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

// Strip the "/api/v1" (or any trailing /api/...) suffix to get the bare backend origin.
const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api(\/v\d+)?\/?$/, "");

export function resolveAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  return `${BACKEND_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
}
