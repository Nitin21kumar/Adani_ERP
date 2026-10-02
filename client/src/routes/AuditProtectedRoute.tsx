import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuditAuth } from "@/contexts/AuditAuthContext";
import type { AuditRole } from "@/types/audit";

interface AuditProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: AuditRole[];
}

/** Guards an audit route: redirects to /audit/login if unauthenticated, or /audit/unauthorized if role mismatched. */
export default function AuditProtectedRoute({ children, allowedRoles }: AuditProtectedRouteProps) {
  const { isAuthenticated, isLoading, auditUser } = useAuditAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/audit/login" replace />;
  if (allowedRoles && auditUser && !allowedRoles.includes(auditUser.role)) return <Navigate to="/audit/unauthorized" replace />;

  return <>{children}</>;
}
