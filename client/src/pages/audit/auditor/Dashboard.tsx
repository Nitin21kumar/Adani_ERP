import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ClipboardList, CheckCircle2, Clock, BadgeCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/shared/StatCard";
import { auditDashboardService } from "@/services/audit/dashboardService";
import { auditTaskService } from "@/services/audit/taskService";
import { auditVerificationService } from "@/services/audit/verificationService";

export default function AuditorDashboard() {
  const navigate = useNavigate();
  const { data: summary, isLoading: summaryLoading } = useQuery({ queryKey: ["audit", "dashboard-summary"], queryFn: auditDashboardService.summary });
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["audit", "my-tasks", "open"],
    queryFn: () => auditTaskService.myTasks({ limit: 50 }),
  });
  // A task covers one location and can hold several assets — count how many
  // have been logged per task so the list gives a sense of progress at a
  // glance, without assuming a 1:1 task-to-asset relationship.
  const { data: verifications } = useQuery({
    queryKey: ["audit", "my-verifications", "active"],
    queryFn: () => auditVerificationService.myVerifications({ limit: 200 }),
  });

  const openTasks = tasks?.items.filter((t) => t.status !== "completed") || [];
  const verificationCountByTask = new Map<string, number>();
  (verifications?.items || []).forEach((v) => verificationCountByTask.set(v.auditTask.id, (verificationCountByTask.get(v.auditTask.id) || 0) + 1));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Dashboard</h1>
        <p className="text-sm text-muted-foreground">Your assigned audit tasks and verification progress.</p>
      </div>

      {!summaryLoading && summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="My Tasks" value={summary.total_tasks} icon={ClipboardList} accent="primary" />
          <StatCard label="Completed" value={summary.completed_tasks} icon={CheckCircle2} accent="success" />
          <StatCard label="Awaiting MIS" value={summary.pending_verifications} icon={Clock} accent="warning" delay={0.05} />
          <StatCard label="MIS Approved" value={summary.mis_approved_verifications} icon={BadgeCheck} accent="success" delay={0.1} />
        </div>
      )}

      <Card className="glass">
        <CardHeader><CardTitle>Assigned Tasks</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Task Code</th>
                <th className="px-6 py-3 font-medium">Title</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Assets Logged</th>
                <th className="px-6 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {tasksLoading && <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Loading…</td></tr>}
              {openTasks.map((t) => (
                <tr key={t.id} className="border-b border-border/50 last:border-0">
                  <td className="px-6 py-3 font-mono text-xs">{t.taskCode}</td>
                  <td className="px-6 py-3">{t.title || "—"}</td>
                  <td className="px-6 py-3 capitalize text-muted-foreground">{t.status.replace("_", " ")}</td>
                  <td className="px-6 py-3">{verificationCountByTask.get(t.id) || 0}</td>
                  <td className="px-6 py-3">
                    <Button size="sm" onClick={() => navigate(`/audit/auditor/verify?taskId=${t.id}`)}>
                      {verificationCountByTask.get(t.id) ? "Open Task" : "Start Verification"}
                    </Button>
                  </td>
                </tr>
              ))}
              {!tasksLoading && !openTasks.length && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No open tasks assigned to you right now.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
