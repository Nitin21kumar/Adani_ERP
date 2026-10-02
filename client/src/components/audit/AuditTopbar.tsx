import { Moon, Sun, LogOut, PanelLeftClose, PanelLeftOpen, ShieldCheck } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuditAuth } from "@/contexts/AuditAuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import NotificationBell from "./NotificationBell";

interface AuditTopbarProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

const roleLabel: Record<string, string> = {
  audit_admin: "Audit Admin",
  auditor: "Auditor",
  mis_verifier: "MIS Verifier",
};

export default function AuditTopbar({ sidebarCollapsed, onToggleSidebar }: AuditTopbarProps) {
  const { auditUser, logout } = useAuditAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const breadcrumb = location.pathname.split("/").filter(Boolean).map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1)).join(" / ");

  return (
    <header className="glass sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border/60 px-6 py-3">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <PanelLeftOpen className="h-4.5 w-4.5" /> : <PanelLeftClose className="h-4.5 w-4.5" />}
        </button>
        <p className="text-xs text-muted-foreground">{breadcrumb || "Dashboard"}</p>
      </div>

      <div className="flex items-center gap-3">
        {auditUser?.role === "mis_verifier" && <NotificationBell />}
        <button onClick={toggleTheme} className="rounded-lg p-2 hover:bg-secondary" aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </button>

        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium leading-none">{auditUser?.name}</p>
            <p className="text-xs text-muted-foreground">{auditUser ? roleLabel[auditUser.role] : ""}</p>
          </div>
        </div>

        <button onClick={logout} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10" title="Logout">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
