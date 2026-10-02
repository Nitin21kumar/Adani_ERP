import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";
import { leaveService } from "@/services/leaveService";

export default function AdminLeaveManagement() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("pending");

  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin-leave", statusFilter],
    queryFn: () => leaveService.list({ status: statusFilter || undefined }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => leaveService.approve(id),
    onSuccess: () => {
      toast.success("Leave approved. Employee notified by email.");
      queryClient.invalidateQueries({ queryKey: ["admin-leave"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => leaveService.reject(id, "Rejected by admin"),
    onSuccess: () => {
      toast.success("Leave rejected. Employee notified by email.");
      queryClient.invalidateQueries({ queryKey: ["admin-leave"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-sm text-muted-foreground">Review and approve employee leave requests.</p>
        </div>
        <select
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="">All</option>
        </select>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Requests {requests ? `(${requests.length})` : ""}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Employee</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Dates</th>
                <th className="px-6 py-3 font-medium">Reason</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {requests?.map((l) => (
                <tr key={l.id} className="border-b border-border/50 last:border-0">
                  <td className="px-6 py-3 font-medium">{l.employee?.full_name || l.employee_id}</td>
                  <td className="px-6 py-3 capitalize">{l.leave_type.replace("_", " ")}</td>
                  <td className="px-6 py-3 text-muted-foreground">
                    {format(new Date(l.from_date), "MMM d")} – {format(new Date(l.to_date), "MMM d, yyyy")}
                  </td>
                  <td className="max-w-xs truncate px-6 py-3">{l.reason}</td>
                  <td className="px-6 py-3"><StatusBadge status={l.status} /></td>
                  <td className="px-6 py-3">
                    {l.status === "pending" ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => approveMutation.mutate(l.id)} disabled={approveMutation.isPending}>
                          <Check className="h-3.5 w-3.5" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => rejectMutation.mutate(l.id)} disabled={rejectMutation.isPending}>
                          <X className="h-3.5 w-3.5" /> Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">{l.review_comment || "—"}</span>
                    )}
                  </td>
                </tr>
              ))}
              {!isLoading && !requests?.length && (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No requests found.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
