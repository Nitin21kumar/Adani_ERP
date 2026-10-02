import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { RoleName } from "@/types";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: RoleName[];
}

/** Guards a route: redirects to /login if unauthenticated, or /unauthorized if role mismatched. */
export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && user && !allowedRoles.includes(user.role.name)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
