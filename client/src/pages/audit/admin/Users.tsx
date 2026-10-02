import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserPlus, Search, Ban, CheckCircle2, Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Pagination from "@/components/audit/Pagination";
import { auditUserService } from "@/services/audit/userService";
import type { AuditRole } from "@/types/audit";

const createSchema = z.object({
  name: z.string().min(2, "Required"),
  email: z.string().email(),
  password: z.string().min(6, "At least 6 characters"),
  role: z.enum(["auditor", "mis_verifier", "audit_admin"]),
});
type CreateFormValues = z.infer<typeof createSchema>;

const roleLabel: Record<AuditRole, string> = { audit_admin: "Audit Admin", auditor: "Auditor", mis_verifier: "MIS Verifier" };

export default function AuditAdminUsers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [skip, setSkip] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["audit", "users", search, roleFilter, skip],
    queryFn: () => auditUserService.list({ search: search || undefined, role: roleFilter || undefined, limit, skip }),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: "auditor" },
  });

  const createMutation = useMutation({
    mutationFn: auditUserService.create,
    onSuccess: () => {
      toast.success("Audit user created.");
      reset();
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["audit", "users"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to create user"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "inactive" }) => auditUserService.update(id, { status }),
    onSuccess: () => {
      toast.success("Status updated.");
      queryClient.invalidateQueries({ queryKey: ["audit", "users"] });
    },
    onError: () => toast.error("Failed to update status"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Auditor & MIS Users</h1>
          <p className="text-sm text-muted-foreground">Create and manage separate audit accounts — independent of Employee ERP logins.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <UserPlus className="h-4 w-4" /> Add Audit User
        </Button>
      </div>

      <Card className="glass">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name or email..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setSkip(0); }} />
          </div>
          <select className="h-10 rounded-md border border-border bg-background px-3 text-sm" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setSkip(0); }}>
            <option value="">All Roles</option>
            <option value="auditor">Auditor</option>
            <option value="mis_verifier">MIS Verifier</option>
            <option value="audit_admin">Audit Admin</option>
          </select>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <CardTitle>All Audit Users {data ? `(${data.total})` : ""}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Loading…</td></tr>}
              {data?.items.map((u) => (
                <tr key={u.id} className="border-b border-border/50 last:border-0">
                  <td className="px-6 py-3 font-medium">{u.name}</td>
                  <td className="px-6 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-6 py-3">{roleLabel[u.role]}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${u.status === "active" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    {u.status === "active" ? (
                      <Button size="icon" variant="ghost" title="Deactivate" onClick={() => statusMutation.mutate({ id: u.id, status: "inactive" })}>
                        <Ban className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    ) : (
                      <Button size="icon" variant="ghost" title="Activate" onClick={() => statusMutation.mutate({ id: u.id, status: "active" })}>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {!isLoading && !data?.items.length && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No audit users found.</td></tr>
              )}
            </tbody>
          </table>
          {data && <Pagination total={data.total} limit={limit} skip={skip} onSkipChange={setSkip} />}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Audit User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input type="password" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <select className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm" {...register("role")}>
                <option value="auditor">Auditor</option>
                <option value="mis_verifier">MIS Verifier</option>
                <option value="audit_admin">Audit Admin</option>
              </select>
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Audit User
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
