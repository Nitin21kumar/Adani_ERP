import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Loader2, Ban, CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { damageCriteriaService } from "@/services/audit/damageCriteriaService";

const schema = z.object({ name: z.string().min(2, "Required"), category: z.string().optional() });
type FormValues = z.infer<typeof schema>;

export default function AuditAdminDamageCriteria() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ["audit", "damage-criteria"], queryFn: () => damageCriteriaService.list({ limit: 200 }) });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: damageCriteriaService.create,
    onSuccess: () => {
      toast.success("Damage criteria added.");
      reset();
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["audit", "damage-criteria"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to add damage criteria"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => damageCriteriaService.update(id, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["audit", "damage-criteria"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Damage Criteria</h1>
          <p className="text-sm text-muted-foreground">Options auditors can select when logging asset damage.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" /> Add Damage Criteria
        </Button>
      </div>

      <Card className="glass">
        <CardHeader><CardTitle>All Damage Criteria {data ? `(${data.total})` : ""}</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">Loading…</td></tr>}
              {data?.items.map((d) => (
                <tr key={d.id} className="border-b border-border/50 last:border-0">
                  <td className="px-6 py-3 font-medium">{d.name}</td>
                  <td className="px-6 py-3 text-muted-foreground">{d.category || "—"}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${d.active ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                      {d.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    {d.active ? (
                      <Button size="icon" variant="ghost" title="Deactivate" onClick={() => toggleMutation.mutate({ id: d.id, active: false })}>
                        <Ban className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    ) : (
                      <Button size="icon" variant="ghost" title="Activate" onClick={() => toggleMutation.mutate({ id: d.id, active: true })}>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {!isLoading && !data?.items.length && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">No damage criteria yet.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Damage Criteria</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit((v) => createMutation.mutate(v))} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input placeholder="e.g. Screen Cracked" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Category (optional)</Label>
              <Input placeholder="e.g. Physical Damage" {...register("category")} />
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Add
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
