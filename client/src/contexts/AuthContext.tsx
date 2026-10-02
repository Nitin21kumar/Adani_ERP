import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/authService";
import { clearTokens, getAccessToken, storeTokens } from "@/services/api";
import { useGeolocation } from "@/hooks/useGeolocation";
import { reverseGeocode } from "@/utils/deviceInfo";
import type { LoginPayload, RoleName, User } from "@/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  logout: () => Promise<void>;
  hasRole: (...roles: RoleName[]) => boolean;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { request: requestLocation } = useGeolocation();
  const queryClient = useQueryClient();

  const loadUser = async () => {
    if (!getAccessToken()) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const currentUser = await authService.me();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (payload: LoginPayload) => {
    const tokens = await authService.login(payload);
    storeTokens(tokens, payload.remember_me);
    const currentUser = await authService.me();
    setUser(currentUser);
    // Wipe any cached data from before this login (a previous session in
    // this tab, or public pre-login queries like company branding) so the
    // dashboard and every other screen fetch fresh instead of briefly
    // showing stale/previous data.
    queryClient.clear();
    return currentUser;
  };

  const logout = async () => {
    try {
      // Best-effort location capture at logout — same graceful-degradation
      // rule as login: a denied/unavailable location never blocks the
      // logout itself, it's simply omitted.
      const coords = await requestLocation();
      const address = coords ? await reverseGeocode(coords.latitude, coords.longitude) : null;

      // Records logout time + total session duration server-side, and
      // enforces the Daily-Work-Before-Logout policy (a 403 here means the
      // employee hasn't submitted today's report and has no admin override —
      // that block must actually stop the logout, not just be logged).
      await authService.logout({
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        full_address: address ?? undefined,
      });
    } catch (err: any) {
      if (err?.response?.status === 403) {
        throw err; // let the caller (e.g. the Logout button) show this to the user
      }
      // Any other failure (network hiccup, already-expired token, geolocation
      // error, etc.) — never trap the user in the app because of this.
    }
    clearTokens();
    setUser(null);
    queryClient.clear();
    window.location.href = "/login";
  };

  const hasRole = (...roles: RoleName[]) => !!user && roles.includes(user.role.name);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, login, logout, hasRole, refetchUser: loadUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
