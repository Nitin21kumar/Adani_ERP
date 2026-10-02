import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";
import { wfhService } from "@/services/wfhService";

export default function AdminWorkFromHome() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("pending");

  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin-wfh", statusFilter],
    queryFn: () => wfhService.list({ status: statusFilter || undefined }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => wfhService.approve(id),
    onSuccess: () => {
      toast.success("WFH approved. Employee notified by email.");
      queryClient.invalidateQueries({ queryKey: ["admin-wfh"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => wfhService.reject(id, "Rejected by admin"),
    onSuccess: () => {
      toast.success("WFH rejected. Employee notified by email.");
      queryClient.invalidateQueries({ queryKey: ["admin-wfh"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Work From Home Requests</h1>
          <p className="text-sm text-muted-foreground">Review and approve remote work requests.</p>
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
                <th className="px-6 py-3 font-medium">Dates</th>
                <th className="px-6 py-3 font-medium">Reason</th>
                <th className="px-6 py-3 font-medium">Expected Work</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {requests?.map((w) => (
                <tr key={w.id} className="border-b border-border/50 last:border-0">
                  <td className="px-6 py-3 font-medium">{w.employee?.full_name || w.employee_id}</td>
                  <td className="px-6 py-3 text-muted-foreground">
                    {format(new Date(w.from_date), "MMM d")} – {format(new Date(w.to_date), "MMM d, yyyy")}
                  </td>
                  <td className="max-w-xs truncate px-6 py-3">{w.reason}</td>
                  <td className="max-w-xs truncate px-6 py-3">{w.expected_work}</td>
                  <td className="px-6 py-3"><StatusBadge status={w.status} /></td>
                  <td className="px-6 py-3">
                    {w.status === "pending" ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => approveMutation.mutate(w.id)} disabled={approveMutation.isPending}>
                          <Check className="h-3.5 w-3.5" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => rejectMutation.mutate(w.id)} disabled={rejectMutation.isPending}>
                          <X className="h-3.5 w-3.5" /> Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">{w.review_comment || "—"}</span>
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
