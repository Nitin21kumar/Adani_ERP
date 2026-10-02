import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import CompanyLogo from "@/components/shared/CompanyLogo";
import { cn } from "@/utils/cn";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

interface SidebarProps {
  items: NavItem[];
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ items, collapsed, onToggle }: SidebarProps) {
  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 260 }}
      transition={{ duration: 0.2 }}
      className="glass sticky top-0 h-screen shrink-0 border-r border-border/60 flex flex-col"
    >
      <div className="px-4 py-5">
        <CompanyLogo size={44} showName={!collapsed} />
      </div>

      <nav className="flex-1 space-y-1 px-2 overflow-y-auto">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-gradient text-white shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )
            }
          >
            <item.icon className="h-4.5 w-4.5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={onToggle}
        className="m-2 flex items-center justify-center rounded-lg border border-border py-2 text-muted-foreground hover:bg-secondary"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </motion.aside>
  );
}
