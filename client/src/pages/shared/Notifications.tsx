import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Bell, BellOff, CheckCheck } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { notificationService } from "@/services/notificationService";

const iconAccent: Record<string, string> = {
  leave_applied: "text-primary",
  leave_approved: "text-emerald-500",
  leave_rejected: "text-destructive",
  wfh_applied: "text-primary",
  wfh_approved: "text-emerald-500",
  wfh_rejected: "text-destructive",
  photo_request_submitted: "text-primary",
  photo_request_approved: "text-emerald-500",
  photo_request_rejected: "text-destructive",
  profile_change_request_submitted: "text-primary",
  profile_change_request_approved: "text-emerald-500",
  profile_change_request_rejected: "text-destructive",
  holiday: "text-primary",
  announcement: "text-primary",
  password_reset: "text-amber-500",
  general: "text-muted-foreground",
};

export default function NotificationCenter() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationService.myNotifications(100),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <Button size="sm" variant="outline" onClick={() => markAllReadMutation.mutate()}>
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border/60 p-0">
          {isLoading && <p className="p-6 text-center text-muted-foreground">Loading…</p>}
          {notifications?.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.is_read && markReadMutation.mutate(n.id)}
              className={cn(
                "flex w-full items-start gap-3 px-6 py-4 text-left transition-colors hover:bg-secondary/50",
                !n.is_read && "bg-primary/5"
              )}
            >
              <Bell className={cn("mt-0.5 h-4 w-4 shrink-0", iconAccent[n.type] || iconAccent.general)} />
              <div className="flex-1">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-sm text-muted-foreground">{n.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </p>
              </div>
              {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
            </button>
          ))}
          {!isLoading && !notifications?.length && (
            <div className="flex flex-col items-center gap-2 p-10 text-muted-foreground">
              <BellOff className="h-8 w-8" />
              <p>No notifications yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
