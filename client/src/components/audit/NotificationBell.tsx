import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, PackageSearch, CheckCheck } from "lucide-react";
import { auditNotificationService } from "@/services/audit/notificationService";
import { cn } from "@/utils/cn";

const iconByType: Record<string, typeof PackageSearch> = {
  new_product: PackageSearch,
};

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** Polls for audit notifications (e.g. "auditor reported a product not in Product Master yet") — no websockets, matching this app's simplicity elsewhere. */
export default function NotificationBell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["audit", "notifications"],
    queryFn: () => auditNotificationService.list(),
    refetchInterval: 30_000,
  });

  const handleOpenNotification = async (id: string, verificationId?: string) => {
    setOpen(false);
    await auditNotificationService.markRead(id);
    queryClient.invalidateQueries({ queryKey: ["audit", "notifications"] });
    if (verificationId) navigate(`/audit/mis/verification/${verificationId}`);
  };

  const handleMarkAllRead = async () => {
    await auditNotificationService.markAllRead();
    queryClient.invalidateQueries({ queryKey: ["audit", "notifications"] });
  };

  const unreadCount = data?.unreadCount || 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="glass absolute right-0 z-20 mt-2 w-80 rounded-lg border border-border shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <p className="text-sm font-semibold">Notifications</p>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {!data?.items.length && <p className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications yet.</p>}
              {data?.items.map((n) => {
                const Icon = iconByType[n.type] || Bell;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleOpenNotification(n.id, n.verification?.id)}
                    className={cn("flex w-full items-start gap-3 border-b border-border/50 px-4 py-3 text-left last:border-0 hover:bg-secondary", !n.read && "bg-primary/5")}
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
