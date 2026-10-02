import { Moon, Search, Sun, LogOut, User as UserIcon, KeyRound, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Input } from "@/components/ui/input";
import CompanyLogo from "@/components/shared/CompanyLogo";
import { profileService } from "@/services/profileService";
import { resolveAssetUrl } from "@/utils/assetUrl";

interface TopbarProps {
  /** Sidebar collapsed state — when provided, a toggle button is shown. */
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export default function Topbar({ sidebarCollapsed, onToggleSidebar }: TopbarProps) {
  const { user, logout, hasRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Same cache key Profile.tsx uses — shared across the app, no extra
  // network round-trip once either has fetched it.
  const { data: myProfile } = useQuery({
    queryKey: ["profile", "me"],
    queryFn: profileService.me,
    staleTime: 60 * 1000,
    retry: 1,
  });
  const displayName = myProfile?.full_name || user?.email || "";
  const avatarUrl = resolveAssetUrl(myProfile?.photo_url);

  const canSearchEmployees = hasRole("super_admin", "admin", "hr", "manager");

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchValue.trim()) {
      navigate(`/admin/employees?search=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err: any) {
      if (err?.response?.status === 403) {
        toast.error(err.response?.data?.detail || "Please submit today's daily work update before logging out.");
        setProfileOpen(false);
        navigate("/employee/daily-work");
        return;
      }
      toast.error("Something went wrong while logging out. Please try again.");
    }
  };

  const breadcrumb = location.pathname
    .split("/")
    .filter(Boolean)
    .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1))
    .join(" / ");

  return (
    <header className="glass sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border/60 px-6 py-3">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="h-4.5 w-4.5" /> : <PanelLeftClose className="h-4.5 w-4.5" />}
          </button>
        )}
        <CompanyLogo size={28} showName={false} className="md:hidden" />
        <p className="text-xs text-muted-foreground">{breadcrumb || "Dashboard"}</p>
      </div>

      {canSearchEmployees && (
        <div className="relative hidden max-w-md flex-1 md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search employees by name, email, or code — press Enter"
            className="pl-9"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        <button onClick={toggleTheme} className="rounded-lg p-2 hover:bg-secondary" aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </button>

        <div className="relative">
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-secondary"
          >
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                displayName?.[0]?.toUpperCase()
              )}
            </div>
            <span className="hidden text-sm font-medium md:block">{displayName}</span>
          </button>

          {profileOpen && (
            <div className="glass absolute right-0 mt-2 w-56 rounded-lg border border-border p-1 shadow-lg">
              <a href="/employee/profile" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-secondary">
                <UserIcon className="h-4 w-4" /> Profile
              </a>
              <a href="/employee/change-password" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-secondary">
                <KeyRound className="h-4 w-4" /> Change Password
              </a>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
