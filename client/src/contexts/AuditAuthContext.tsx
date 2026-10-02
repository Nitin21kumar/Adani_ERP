import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { auditAuthService } from "@/services/audit/authService";
import { clearAuditToken, getAuditToken, storeAuditToken } from "@/services/audit/api";
import type { AuditLoginPayload, AuditRole, AuditUser } from "@/types/audit";

interface AuditAuthContextValue {
  auditUser: AuditUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: AuditLoginPayload) => Promise<AuditUser>;
  logout: () => void;
  hasAuditRole: (...roles: AuditRole[]) => boolean;
}

// Entirely independent from contexts/AuthContext.tsx (the Employee ERP's
// auth) — separate state, separate storage key (see services/audit/api.ts),
// and it never imports or calls into the employee AuthContext.
const AuditAuthContext = createContext<AuditAuthContextValue | undefined>(undefined);

export function AuditAuthProvider({ children }: { children: ReactNode }) {
  const [auditUser, setAuditUser] = useState<AuditUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = async () => {
    if (!getAuditToken()) {
      setAuditUser(null);
      setIsLoading(false);
      return;
    }
    try {
      setAuditUser(await auditAuthService.me());
    } catch {
      setAuditUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (payload: AuditLoginPayload) => {
    const { access_token, user } = await auditAuthService.login(payload);
    storeAuditToken(access_token);
    setAuditUser(user);
    return user;
  };

  const logout = () => {
    clearAuditToken();
    setAuditUser(null);
    window.location.href = "/audit/login";
  };

  const hasAuditRole = (...roles: AuditRole[]) => !!auditUser && roles.includes(auditUser.role);

  return (
    <AuditAuthContext.Provider value={{ auditUser, isLoading, isAuthenticated: !!auditUser, login, logout, hasAuditRole }}>
      {children}
    </AuditAuthContext.Provider>
  );
}

export function useAuditAuth() {
  const ctx = useContext(AuditAuthContext);
  if (!ctx) throw new Error("useAuditAuth must be used within AuditAuthProvider");
  return ctx;
}
