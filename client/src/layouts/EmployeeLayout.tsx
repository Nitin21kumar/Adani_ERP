import { useState } from "react";
import { Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarCheck,
  FileText,
  CalendarDays,
  Home,
  Bell,
  User,
  KeyRound,
} from "lucide-react";
import Sidebar, { type NavItem } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

const navItems: NavItem[] = [
  { label: "Dashboard", to: "/employee/dashboard", icon: LayoutDashboard },
  { label: "Attendance", to: "/employee/attendance", icon: CalendarCheck },
  { label: "Daily Work", to: "/employee/daily-work", icon: FileText },
  { label: "Leave", to: "/employee/leave", icon: CalendarDays },
  { label: "Work From Home", to: "/employee/wfh", icon: Home },
  { label: "Notifications", to: "/employee/notifications", icon: Bell },
  { label: "Profile", to: "/employee/profile", icon: User },
  { label: "Change Password", to: "/employee/change-password", icon: KeyRound },
];

export default function EmployeeLayout() {
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
