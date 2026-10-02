import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import AuditSidebar from "@/components/audit/AuditSidebar";
import AuditTopbar from "@/components/audit/AuditTopbar";

/** Standalone layout for the Asset Audit & Verification Portal — parallel to, and independent from, AdminLayout/EmployeeLayout. */
export default function AuditLayout() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Adani Power | Asset Audit Portal";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <AuditSidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="flex-1">
        <AuditTopbar sidebarCollapsed={collapsed} onToggleSidebar={() => setCollapsed((c) => !c)} />
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
