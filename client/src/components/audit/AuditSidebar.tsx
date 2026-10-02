import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Package,
  ShieldAlert,
  Gauge,
  ClipboardList,
  ClipboardCheck,
  History,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuditAuth } from "@/contexts/AuditAuthContext";
import { cn } from "@/utils/cn";
import adaniPowerLogo from "@/assets/adani-power-logo.jpg";

interface AuditNavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
}

const navByRole: Record<string, AuditNavItem[]> = {
  audit_admin: [
    { label: "Dashboard", to: "/audit/admin/dashboard", icon: LayoutDashboard },
    { label: "Auditor & MIS Users", to: "/audit/admin/users", icon: Users },
    { label: "Damage Criteria", to: "/audit/admin/damage-criteria", icon: ShieldAlert },
    { label: "Condition Ratings", to: "/audit/admin/condition-ratings", icon: Gauge },
    { label: "Audit Tasks", to: "/audit/admin/tasks", icon: ClipboardList },
  ],
  auditor: [
    { label: "Dashboard", to: "/audit/auditor/dashboard", icon: LayoutDashboard },
    { label: "Verify Asset", to: "/audit/auditor/verify", icon: ClipboardCheck },
    { label: "History", to: "/audit/auditor/history", icon: History },
  ],
  mis_verifier: [
    { label: "Dashboard", to: "/audit/mis/dashboard", icon: LayoutDashboard },
    { label: "Pending Verifications", to: "/audit/mis/pending", icon: ClipboardCheck },
    { label: "Product Master", to: "/audit/mis/products", icon: Package },
  ],
};

interface AuditSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

/**
 * Standalone sidebar for the Asset Audit & Verification Portal. Does not
 * import or extend components/layout/Sidebar.tsx (which is wired to the
 * Employee ERP's AuthContext) — the Employee ERP sidebar never shows audit
 * menus, and this one only ever shows audit menus.
 */
export default function AuditSidebar({ collapsed, onToggle }: AuditSidebarProps) {
  const { auditUser } = useAuditAuth();
  const items = (auditUser && navByRole[auditUser.role]) || [];

  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 260 }}
      transition={{ duration: 0.2 }}
      className="glass sticky top-0 h-screen shrink-0 border-r border-border/60 flex flex-col"
    >
      <div className="flex items-center gap-2 px-4 py-5">
        <img src={adaniPowerLogo} alt="Adani Power" className="h-11 w-11 shrink-0 rounded-lg bg-white object-contain" />
        {!collapsed && (
          <div>
            <p className="text-sm font-semibold leading-none text-brand-gradient">Adani Power</p>
            <p className="mt-1 text-xs text-muted-foreground">Asset Audit Portal</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-2 overflow-y-auto">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-brand-gradient text-white shadow-sm" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )
            }
          >
            <item.icon className="h-4.5 w-4.5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <button onClick={onToggle} className="m-2 flex items-center justify-center rounded-lg border border-border py-2 text-muted-foreground hover:bg-secondary">
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </motion.aside>
  );
}
