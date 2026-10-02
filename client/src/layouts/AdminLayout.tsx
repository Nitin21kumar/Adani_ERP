import { useState } from "react";
import { Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Home,
  FileText,
  Bell,
  BarChart3,
  Settings,
  History,
  UserCog,
} from "lucide-react";
import Sidebar, { type NavItem } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

const navItems: NavItem[] = [
  { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Employees", to: "/admin/employees", icon: Users },
  { label: "Leave Management", to: "/admin/leave", icon: CalendarDays },
  { label: "Work From Home", to: "/admin/wfh", icon: Home },
  { label: "Daily Reports", to: "/admin/daily-reports", icon: FileText },
  { label: "Profile Requests", to: "/admin/profile-requests", icon: UserCog },
  { label: "Attendance History", to: "/admin/attendance-history", icon: History },
  { label: "Notifications", to: "/admin/notifications", icon: Bell },
  { label: "Reports", to: "/admin/reports", icon: BarChart3 },
  { label: "Settings", to: "/admin/settings", icon: Settings },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar items={navItems} collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="flex-1">
        <Topbar sidebarCollapsed={collapsed} onToggleSidebar={() => setCollapsed((c) => !c)} />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
