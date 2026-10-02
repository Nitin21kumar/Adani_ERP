import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Search, Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Pagination from "@/components/audit/Pagination";
import { auditTaskService } from "@/services/audit/taskService";
import { auditUserService } from "@/services/audit/userService";
import type { AuditTaskStatus } from "@/types/audit";

const schema = z.object({ auditor: z.string().min(1, "Select an auditor"), taskCode: z.string().optional(), title: z.string().optional(), notes: z.string().optional() });
type FormValues = z.infer<typeof schema>;

const statusStyle: Record<AuditTaskStatus, string> = {
  assigned: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  in_progress: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

export default function AuditAdminTasks() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [skip, setSkip] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["audit", "tasks", search, statusFilter, skip],
    queryFn: () => auditTaskService.list({ search: search || undefined, status: statusFilter || undefined, limit, skip }),
  });

  const { data: auditors } = useQuery({
    queryKey: ["audit", "users", "auditor-options"],
    queryFn: () => auditUserService.list({ role: "auditor", status: "active", limit: 200 }),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: auditTaskService.create,
    onSuccess: () => {
      toast.success("Task created and assigned.");
      reset();
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["audit", "tasks"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to create task"),
  });

  const reassignMutation = useMutation({
    mutationFn: ({ id, auditor }: { id: string; auditor: string }) => auditTaskService.update(id, { auditor }),
    onSuccess: () => {
      toast.success("Task reassigned.");
      queryClient.invalidateQueries({ queryKey: ["audit", "tasks"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to reassign task"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Tasks</h1>
          <p className="text-sm text-muted-foreground">Create and assign asset-verification tasks to auditors.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" /> New Task
        </Button>
      </div>

      <Card className="glass">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by task code or title..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setSkip(0); }} />
          </div>
          <select className="h-10 rounded-md border border-border bg-background px-3 text-sm" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setSkip(0); }}>
            <option value="">All Status</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader><CardTitle>All Tasks {data ? `(${data.total})` : ""}</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Task Code</th>
                <th className="px-6 py-3 font-medium">Title</th>
                <th className="px-6 py-3 font-medium">Auditor</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Reassign</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Loading…</td></tr>}
              {data?.items.map((t) => (
                <tr key={t.id} className="border-b border-border/50 last:border-0">
                  <td className="px-6 py-3 font-mono text-xs">{t.taskCode}</td>
                  <td className="px-6 py-3">{t.title || "—"}</td>
                  <td className="px-6 py-3 text-muted-foreground">{t.auditor?.name}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyle[t.status]}`}>{t.status.replace("_", " ")}</span>
                  </td>
                  <td className="px-6 py-3">
                    <select
                      className="h-9 rounded-md border border-border bg-background px-2 text-xs"
                      value={t.auditor?.id}
                      disabled={t.status === "completed" || reassignMutation.isPending}
                      onChange={(e) => reassignMutation.mutate({ id: t.id, auditor: e.target.value })}
                    >
                      {auditors?.items.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {!isLoading && !data?.items.length && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No audit tasks yet.</td></tr>
              )}
            </tbody>
          </table>
          {data && <Pagination total={data.total} limit={limit} skip={skip} onSkipChange={setSkip} />}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Audit Task</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Auditor</Label>
              <select className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm" {...register("auditor")}>
                <option value="">Select auditor</option>
                {auditors?.items.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
                ))}
              </select>
              {errors.auditor && <p className="text-xs text-destructive">{errors.auditor.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Title (optional)</Label>
              <Input placeholder="e.g. Warehouse A — Q3 Audit" {...register("title")} />
            </div>
            <div className="space-y-1.5">
              <Label>Task Code (optional — auto-generated if blank)</Label>
              <Input placeholder="AT0001" {...register("taskCode")} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <textarea className="flex min-h-[70px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm" {...register("notes")} />
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending || !auditors?.items.length}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create & Assign
            </Button>
            {!auditors?.items.length && <p className="text-xs text-muted-foreground">Create an active Auditor account first.</p>}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
