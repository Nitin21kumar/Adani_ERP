import { Routes, Route, Navigate } from "react-router-dom";

import Login from "@/pages/auth/Login";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";

import AdminLayout from "@/layouts/AdminLayout";
import EmployeeLayout from "@/layouts/EmployeeLayout";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminEmployees from "@/pages/admin/Employees";
import AdminLeaveManagement from "@/pages/admin/LeaveManagement";
import AdminWorkFromHome from "@/pages/admin/WorkFromHome";
import AdminDailyReports from "@/pages/admin/DailyReports";
import AdminReports from "@/pages/admin/Reports";
import AdminSettings from "@/pages/admin/Settings";
import AdminAttendanceHistory from "@/pages/admin/AttendanceHistory";
import AdminProfileRequests from "@/pages/admin/ProfileRequests";
import EmployeeDashboard from "@/pages/employee/Dashboard";
import EmployeeAttendance from "@/pages/employee/Attendance";
import EmployeeLeave from "@/pages/employee/Leave";
import EmployeeWFH from "@/pages/employee/WorkFromHome";
import EmployeeDailyWork from "@/pages/employee/DailyWork";
import EmployeeProfile from "@/pages/employee/Profile";
import EmployeeChangePassword from "@/pages/employee/ChangePassword";
import NotificationCenter from "@/pages/shared/Notifications";

import ProtectedRoute from "./ProtectedRoute";

// ---- Asset Audit & Verification Portal — separate module, separate auth ----
import AuditProtectedRoute from "./AuditProtectedRoute";
import AuditLayout from "@/layouts/AuditLayout";
import AuditLogin from "@/pages/audit/Login";
import AuditAdminDashboard from "@/pages/audit/admin/Dashboard";
import AuditAdminUsers from "@/pages/audit/admin/Users";
import AuditAdminDamageCriteria from "@/pages/audit/admin/DamageCriteria";
import AuditAdminConditionRatings from "@/pages/audit/admin/ConditionRatings";
import AuditAdminTasks from "@/pages/audit/admin/Tasks";
import AuditorDashboard from "@/pages/audit/auditor/Dashboard";
import AuditorVerify from "@/pages/audit/auditor/Verify";
import AuditorHistory from "@/pages/audit/auditor/History";
import MisDashboard from "@/pages/audit/mis/Dashboard";
import MisPending from "@/pages/audit/mis/Pending";
import MisVerificationDetail from "@/pages/audit/mis/VerificationDetail";
import MisProducts from "@/pages/audit/mis/Products";

const ADMIN_ROLES = ["super_admin", "admin", "hr", "manager"] as const;

function Placeholder({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
      <p className="text-lg font-medium">{title}</p>
      <p className="text-sm">This module will be built next, following the same architecture as Auth.</p>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* ---- Public ---- */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/unauthorized" element={<div className="p-10 text-center">403 — Not authorized</div>} />

      {/* ---- Admin (super_admin, admin, hr, manager) ---- */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={[...ADMIN_ROLES]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="employees" element={<AdminEmployees />} />
        <Route path="leave" element={<AdminLeaveManagement />} />
        <Route path="wfh" element={<AdminWorkFromHome />} />
        <Route path="daily-reports" element={<AdminDailyReports />} />
        <Route path="profile-requests" element={<AdminProfileRequests />} />
        <Route path="departments" element={<Placeholder title="Departments" />} />
        <Route path="roles" element={<Placeholder title="Roles & Permissions" />} />
        <Route path="notifications" element={<NotificationCenter />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="attendance-history" element={<AdminAttendanceHistory />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* ---- Employee (self-service) — open to every role; only the
          Attendance punch page below is restricted to non-admin roles. ---- */}
      <Route
        path="/employee"
        element={
          <ProtectedRoute>
            <EmployeeLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<EmployeeDashboard />} />
        <Route
          path="attendance"
          element={
            <ProtectedRoute allowedRoles={["hr", "manager", "employee"]}>
              <EmployeeAttendance />
            </ProtectedRoute>
          }
        />
        <Route path="daily-work" element={<EmployeeDailyWork />} />
        <Route path="leave" element={<EmployeeLeave />} />
        <Route path="wfh" element={<EmployeeWFH />} />
        <Route path="notifications" element={<NotificationCenter />} />
        <Route path="profile" element={<EmployeeProfile />} />
        <Route path="change-password" element={<EmployeeChangePassword />} />
      </Route>

      {/* ---- Asset Audit & Verification Portal (separate module, separate
          auth — see AuditAuthContext/AuditProtectedRoute). The Employee ERP
          sidebar/routes above are untouched by everything in this block. ---- */}
      <Route path="/audit/login" element={<AuditLogin />} />
      <Route path="/audit/unauthorized" element={<div className="p-10 text-center">403 — Not authorized</div>} />

      <Route
        path="/audit/admin"
        element={
          <AuditProtectedRoute allowedRoles={["audit_admin"]}>
            <AuditLayout />
          </AuditProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AuditAdminDashboard />} />
        <Route path="users" element={<AuditAdminUsers />} />
        <Route path="damage-criteria" element={<AuditAdminDamageCriteria />} />
        <Route path="condition-ratings" element={<AuditAdminConditionRatings />} />
        <Route path="tasks" element={<AuditAdminTasks />} />
      </Route>

      <Route
        path="/audit/auditor"
        element={
          <AuditProtectedRoute allowedRoles={["auditor"]}>
            <AuditLayout />
          </AuditProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AuditorDashboard />} />
        <Route path="verify" element={<AuditorVerify />} />
        <Route path="history" element={<AuditorHistory />} />
      </Route>

      <Route
        path="/audit/mis"
        element={
          <AuditProtectedRoute allowedRoles={["mis_verifier"]}>
            <AuditLayout />
          </AuditProtectedRoute>
        }
      >
        <Route path="dashboard" element={<MisDashboard />} />
        <Route path="pending" element={<MisPending />} />
        <Route path="verification/:id" element={<MisVerificationDetail />} />
        <Route path="products" element={<MisProducts />} />
      </Route>

      {/* ---- Fallback ---- */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<div className="p-10 text-center">404 — Page not found</div>} />
    </Routes>
  );
}
