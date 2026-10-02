import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";
import { profileChangeRequestService } from "@/services/profileChangeRequestService";
import type { ProfileChangeRequest } from "@/types/profileChangeRequest";

const FIELD_LABELS: Record<string, string> = {
  requested_phone: "Phone",
  requested_address: "Address",
  requested_emergency_contact_name: "Emergency Contact Name",
  requested_emergency_contact_phone: "Emergency Contact Phone",
};

function ChangedFields({ request }: { request: ProfileChangeRequest }) {
  const entries = (Object.keys(FIELD_LABELS) as (keyof typeof FIELD_LABELS)[])
    .map((key) => ({ label: FIELD_LABELS[key], value: (request as any)[key] as string | null }))
    .filter((entry) => entry.value);

  if (!entries.length) return <span className="text-muted-foreground">—</span>;

  return (
    <div className="space-y-1">
      {entries.map((entry) => (
        <div key={entry.label} className="text-xs">
          <span className="font-medium">{entry.label}: </span>
          <span className="text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminProfileRequests() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("pending");

  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin-profile-change-requests", statusFilter],
    queryFn: () => profileChangeRequestService.list(statusFilter || undefined),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => profileChangeRequestService.approve(id, "Approved by admin"),
    onSuccess: () => {
      toast.success("Change approved and applied. Employee notified by email.");
      queryClient.invalidateQueries({ queryKey: ["admin-profile-change-requests"] });
    },
    onError: () => toast.error("Failed to approve request"),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => profileChangeRequestService.reject(id, "Please resubmit with correct details"),
    onSuccess: () => {
      toast.success("Change request rejected. Employee notified by email.");
      queryClient.invalidateQueries({ queryKey: ["admin-profile-change-requests"] });
    },
    onError: () => toast.error("Failed to reject request"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile Requests</h1>
          <p className="text-sm text-muted-foreground">
            Employees can't change their phone, address, or emergency contact directly — review and approve or
            reject requests here. (Profile photos are free to change and don't need approval.)
          </p>
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
          <CardTitle>Personal Info Change Requests {requests ? `(${requests.length})` : ""}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Employee</th>
                <th className="px-6 py-3 font-medium">Requested Changes</th>
                <th className="px-6 py-3 font-medium">Submitted</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {requests?.map((req) => (
                <tr key={req.id} className="border-b border-border/50 last:border-0">
                  <td className="px-6 py-3 font-medium align-top">{req.employee?.full_name || req.employee_id}</td>
                  <td className="px-6 py-3 align-top"><ChangedFields request={req} /></td>
                  <td className="px-6 py-3 align-top text-muted-foreground">{format(new Date(req.created_at), "MMM d, yyyy HH:mm")}</td>
                  <td className="px-6 py-3 align-top"><StatusBadge status={req.status} /></td>
                  <td className="px-6 py-3 align-top">
                    {req.status === "pending" ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => approveMutation.mutate(req.id)} disabled={approveMutation.isPending}>
                          <Check className="h-3.5 w-3.5" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => rejectMutation.mutate(req.id)} disabled={rejectMutation.isPending}>
                          <X className="h-3.5 w-3.5" /> Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">{req.review_comment || "—"}</span>
                    )}
                  </td>
                </tr>
              ))}
              {!isLoading && !requests?.length && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No requests found.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
