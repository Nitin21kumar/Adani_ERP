import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { MessageSquare, X } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";
import { dailyReportService } from "@/services/dailyReportService";

const priorityStyles: Record<string, string> = {
  low: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  high: "bg-destructive/10 text-destructive",
};

export default function AdminDailyReports() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [commentingId, setCommentingId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  const { data: reports, isLoading } = useQuery({
    queryKey: ["admin-daily-reports", statusFilter, dateFilter],
    queryFn: () =>
      dailyReportService.list({
        status: statusFilter || undefined,
        date_from: dateFilter || undefined,
        date_to: dateFilter || undefined,
      }),
  });

  const commentMutation = useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) => dailyReportService.comment(id, comment),
    onSuccess: () => {
      toast.success("Comment added and report marked reviewed.");
      setCommentingId(null);
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["admin-daily-reports"] });
    },
    onError: () => toast.error("Failed to add comment"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daily Work Reports</h1>
          <p className="text-sm text-muted-foreground">Review what the team worked on.</p>
        </div>
        <div className="flex gap-2">
          <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-40" />
          <select
            className="h-10 rounded-md border border-border bg-background px-3 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="reviewed">Reviewed</option>
          </select>
        </div>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Reports {reports ? `(${reports.length})` : ""}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Employee</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Title</th>
                <th className="px-6 py-3 font-medium">Hours</th>
                <th className="px-6 py-3 font-medium">Priority</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Comment</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {reports?.map((r) => (
                <tr key={r.id} className="border-b border-border/50 last:border-0 align-top">
                  <td className="px-6 py-3 font-medium">{r.employee?.full_name || r.employee_id}</td>
                  <td className="px-6 py-3 text-muted-foreground">{format(new Date(r.report_date), "MMM d, yyyy")}</td>
                  <td className="max-w-xs px-6 py-3">
                    <p className="font-medium">{r.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.task_description}</p>
                  </td>
                  <td className="px-6 py-3">{r.hours_worked}h</td>
                  <td className="px-6 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium capitalize", priorityStyles[r.priority])}>
                      {r.priority}
                    </span>
                  </td>
                  <td className="px-6 py-3 capitalize text-muted-foreground">{r.status}</td>
                  <td className="px-6 py-3">
                    {commentingId === r.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Add comment..."
                          className="h-8 w-40 text-xs"
                        />
                        <Button
                          size="sm"
                          onClick={() => commentMutation.mutate({ id: r.id, comment: commentText })}
                          disabled={!commentText.trim() || commentMutation.isPending}
                        >
                          Save
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setCommentingId(null)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : r.admin_comments ? (
                      <button
                        className="text-left text-xs text-muted-foreground hover:underline"
                        onClick={() => {
                          setCommentingId(r.id);
                          setCommentText(r.admin_comments || "");
                        }}
                      >
                        {r.admin_comments}
                      </button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setCommentingId(r.id);
                          setCommentText("");
                        }}
                      >
                        <MessageSquare className="h-3.5 w-3.5" /> Comment
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {!isLoading && !reports?.length && (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">No reports found.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
