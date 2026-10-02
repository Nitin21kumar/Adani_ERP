import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  UserPlus,
  Search,
  Ban,
  CheckCircle2,
  KeyRound,
  Trash2,
  Pencil,
  Loader2,
  AlarmClockOff,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StatusBadge from "@/components/shared/StatusBadge";
import { employeeService, departmentService, roleService } from "@/services/employeeService";
import { authService } from "@/services/authService";
import { dailyReportService } from "@/services/dailyReportService";
import type { Employee } from "@/types/employee";

const createSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2, "Required"),
  role_id: z.string().min(1, "Select a role"),
  employee_code: z.string().optional(),
  manager_id: z.string().optional(),
  designation: z.string().optional(),
  joining_date: z.string().optional(),
  phone: z.string().optional(),
});
type CreateFormValues = z.infer<typeof createSchema>;

export default function AdminEmployees() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [overriding, setOverriding] = useState<Employee | null>(null);
  const [overrideReason, setOverrideReason] = useState("");

  const { data: employees, isLoading } = useQuery({
    queryKey: ["employees", search, statusFilter],
    queryFn: () => employeeService.list({ search: search || undefined, status: statusFilter || undefined }),
  });

  const { data: departments } = useQuery({ queryKey: ["departments"], queryFn: departmentService.list });
  const { data: roles } = useQuery({ queryKey: ["roles"], queryFn: roleService.list });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
  });

  const createMutation = useMutation({
    mutationFn: employeeService.create,
    onSuccess: (data) => {
      const isAdminRole = ["super_admin", "admin"].includes(data.employee.role.name);
      toast.success(
        isAdminRole
          ? `Employee created. Login email: ${data.employee.email} · Temp password: ${data.temporary_password} (also emailed).`
          : `Employee created. Login with Employee ID: ${data.employee.employee_code} · Temp password: ${data.temporary_password} (also emailed).`
      );
      reset();
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to create employee"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => employeeService.update(id, payload),
    onSuccess: () => {
      toast.success("Employee updated.");
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

  const blockMutation = useMutation({
    mutationFn: employeeService.block,
    onSuccess: () => {
      toast.success("Employee blocked.");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

  const activateMutation = useMutation({
    mutationFn: employeeService.activate,
    onSuccess: () => {
      toast.success("Employee activated.");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: employeeService.remove,
    onSuccess: () => {
      toast.success("Employee deactivated (soft deleted).");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (userId: string) => authService.adminResetPassword(userId),
    onSuccess: () => toast.success("Password reset email sent to employee."),
    onError: () => toast.error("Failed to send reset email"),
  });

  const overrideMutation = useMutation({
    mutationFn: ({ employeeId, reason }: { employeeId: string; reason: string }) =>
      dailyReportService.grantLogoutOverride(employeeId, { reason: reason || undefined }),
    onSuccess: () => {
      toast.success("Logout override granted for today. The employee has been notified.");
      setOverriding(null);
      setOverrideReason("");
    },
    onError: () => toast.error("Failed to grant override"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
          <p className="text-sm text-muted-foreground">Manage employee profiles, roles, and access.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <UserPlus className="h-4 w-4" /> Add Employee
        </Button>
      </div>

      <Card className="glass">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name, email, or code..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select
            className="h-10 rounded-md border border-border bg-background px-3 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
            <option value="pending">Pending</option>
          </select>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <CardTitle>All Employees {employees ? `(${employees.length})` : ""}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Code</th>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Department</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">Loading…</td></tr>}
              {employees?.map((e) => (
                <tr key={e.id} className="border-b border-border/50 last:border-0">
                  <td className="px-6 py-3 font-mono text-xs">{e.employee_code}</td>
                  <td className="px-6 py-3 font-medium">{e.full_name}</td>
                  <td className="px-6 py-3 text-muted-foreground">{e.email}</td>
                  <td className="px-6 py-3">{e.department?.name || "—"}</td>
                  <td className="px-6 py-3 capitalize">{e.role.name.replace("_", " ")}</td>
                  <td className="px-6 py-3"><StatusBadge status={e.status === "active" ? "approved" : e.status === "blocked" ? "rejected" : "pending"} /></td>
                  <td className="px-6 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Button size="icon" variant="ghost" title="Edit" onClick={() => setEditing(e)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {e.status === "active" ? (
                        <Button size="icon" variant="ghost" title="Block" onClick={() => blockMutation.mutate(e.id)}>
                          <Ban className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      ) : (
                        <Button size="icon" variant="ghost" title="Activate" onClick={() => activateMutation.mutate(e.id)}>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" title="Reset Password" onClick={() => resetPasswordMutation.mutate(e.user_id)}>
                        <KeyRound className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Allow logout without today's daily work update"
                        onClick={() => setOverriding(e)}
                      >
                        <AlarmClockOff className="h-3.5 w-3.5 text-amber-500" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Delete"
                        onClick={() => {
                          if (confirm(`Deactivate ${e.full_name}? This is a soft delete.`)) deleteMutation.mutate(e.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && !employees?.length && (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">No employees found.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* ---- Add Employee Modal ---- */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Employee</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Full Name</Label>
              <Input {...register("full_name")} />
              {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Email</Label>
              <Input type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <select className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm" {...register("role_id")}>
                <option value="">Select role</option>
                {roles?.map((r) => (
                  <option key={r.id} value={r.id}>{r.name.replace("_", " ")}</option>
                ))}
              </select>
              {errors.role_id && <p className="text-xs text-destructive">{errors.role_id.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Employee ID</Label>
              <Input placeholder="Leave blank to auto-generate" {...register("employee_code")} />
              <p className="text-xs text-muted-foreground">
                If left blank, one is generated automatically (EMP0001, EMP0002, ...). If you type one that's
                already in use, you'll be told it's already allocated.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Designation</Label>
              <Input {...register("designation")} />
            </div>
            <div className="space-y-1.5">
              <Label>Joining Date</Label>
              <Input type="date" {...register("joining_date")} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Phone</Label>
              <Input {...register("phone")} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Employee
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ---- Edit Employee Modal ---- */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editing?.full_name}</DialogTitle>
          </DialogHeader>
          {editing && (
            <EditEmployeeForm
              employee={editing}
              departments={departments || []}
              roles={roles || []}
              onSave={(payload) => updateMutation.mutate({ id: editing.id, payload })}
              saving={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ---- Daily-Work-Before-Logout: Grant Override Modal ---- */}
      <Dialog open={!!overriding} onOpenChange={(open) => !open && setOverriding(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allow {overriding?.full_name} to log out today</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Employees are normally blocked from logging out until they submit today's daily work update. This
              grants a one-time exception for today only, and is recorded in the audit log. The employee will be
              notified.
            </p>
            <div className="space-y-1.5">
              <Label>Reason (optional)</Label>
              <textarea
                className="flex min-h-[70px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="e.g. Employee is on approved sick leave today"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              disabled={overrideMutation.isPending}
              onClick={() => overriding && overrideMutation.mutate({ employeeId: overriding.id, reason: overrideReason })}
            >
              {overrideMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlarmClockOff className="h-4 w-4" />}
              Grant Override for Today
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditEmployeeForm({
  employee,
  departments,
  roles,
  onSave,
  saving,
}: {
  employee: Employee;
  departments: { id: string; name: string }[];
  roles: { id: string; name: string }[];
  onSave: (payload: any) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    full_name: employee.full_name,
    designation: employee.designation || "",
    phone: employee.phone || "",
    department_id: employee.department?.id || "",
    role_id: employee.role.id,
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
    >
      <div className="space-y-1.5 sm:col-span-2">
        <Label>Full Name</Label>
        <Input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
      </div>
      <div className="space-y-1.5">
        <Label>Designation</Label>
        <Input value={form.designation} onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))} />
      </div>
      <div className="space-y-1.5">
        <Label>Phone</Label>
        <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
      </div>
      <div className="space-y-1.5">
        <Label>Department</Label>
        <select
          className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
          value={form.department_id}
          onChange={(e) => setForm((f) => ({ ...f, department_id: e.target.value }))}
        >
          <option value="">None</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label>Role</Label>
        <select
          className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
          value={form.role_id}
          onChange={(e) => setForm((f) => ({ ...f, role_id: e.target.value }))}
        >
          {roles.map((r) => (
            <option key={r.id} value={r.id}>{r.name.replace("_", " ")}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" className="w-full" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
