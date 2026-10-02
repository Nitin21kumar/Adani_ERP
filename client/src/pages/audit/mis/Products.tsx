import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Search, Pencil, Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Pagination from "@/components/audit/Pagination";
import { auditProductService } from "@/services/audit/productService";
import type { AuditProduct } from "@/types/audit";

const productSchema = z.object({
  productName: z.string().min(2, "Required"),
  category: z.string().min(1, "Required"),
  subCategory: z.string().optional(),
  allowCustomSubProduct: z.boolean().optional(),
  defaultBaseCost: z.coerce.number().positive("Must be a positive number"),
  active: z.boolean().optional(),
});
type ProductFormValues = z.infer<typeof productSchema>;

function ProductForm({ initial, onSave, saving }: { initial?: AuditProduct; onSave: (v: ProductFormValues) => void; saving: boolean }) {
  const { register, handleSubmit, formState: { errors } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initial ? { ...initial } : { allowCustomSubProduct: false, active: true },
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="space-y-1.5 sm:col-span-2">
        <Label>Product Name</Label>
        <Input {...register("productName")} />
        {errors.productName && <p className="text-xs text-destructive">{errors.productName.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Category</Label>
        <Input {...register("category")} />
        {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Sub Category</Label>
        <Input {...register("subCategory")} />
      </div>
      <div className="space-y-1.5">
        <Label>Default Base Cost</Label>
        <Input type="number" step="0.01" {...register("defaultBaseCost")} />
        {errors.defaultBaseCost && <p className="text-xs text-destructive">{errors.defaultBaseCost.message}</p>}
      </div>
      <div className="flex items-end gap-2 pb-1.5">
        <input type="checkbox" id="allowCustomSubProduct" className="h-4 w-4 rounded border-border" {...register("allowCustomSubProduct")} />
        <Label htmlFor="allowCustomSubProduct" className="cursor-pointer">Allow custom sub-product name</Label>
      </div>
      {initial && (
        <div className="flex items-end gap-2 pb-1.5">
          <input type="checkbox" id="active" className="h-4 w-4 rounded border-border" {...register("active")} />
          <Label htmlFor="active" className="cursor-pointer">Active</Label>
        </div>
      )}
      <div className="sm:col-span-2">
        <Button type="submit" className="w-full" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {initial ? "Save Changes" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}

/** Product Master is managed by MIS Verifiers (not Audit Admin) — see server/src/modules/asset-audit/product.routes.js. */
export default function MisProducts() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [skip, setSkip] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AuditProduct | null>(null);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["audit", "products", search, skip],
    queryFn: () => auditProductService.list({ search: search || undefined, limit, skip }),
  });

  const createMutation = useMutation({
    mutationFn: auditProductService.create,
    onSuccess: () => {
      toast.success("Product created.");
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["audit", "products"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to create product"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<AuditProduct> }) => auditProductService.update(id, payload),
    onSuccess: () => {
      toast.success("Product updated.");
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["audit", "products"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to update product"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Product Master</h1>
          <p className="text-sm text-muted-foreground">Products, categories, and default base costs used in asset verification.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      <Card className="glass">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by product name or category..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setSkip(0); }} />
          </div>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Products {data ? `(${data.total})` : ""}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Product</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Sub Category</th>
                <th className="px-6 py-3 font-medium">Base Cost</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Loading…</td></tr>}
              {data?.items.map((p) => (
                <tr key={p.id} className="border-b border-border/50 last:border-0">
                  <td className="px-6 py-3 font-medium">{p.productName}</td>
                  <td className="px-6 py-3 text-muted-foreground">{p.category}</td>
                  <td className="px-6 py-3 text-muted-foreground">{p.subCategory || "—"}</td>
                  <td className="px-6 py-3">₹{p.defaultBaseCost.toLocaleString()}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${p.active ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                      {p.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <Button size="icon" variant="ghost" title="Edit" onClick={() => setEditing(p)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
              {!isLoading && !data?.items.length && (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No products found.</td></tr>
              )}
            </tbody>
          </table>
          {data && <Pagination total={data.total} limit={limit} skip={skip} onSkipChange={setSkip} />}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Product</DialogTitle></DialogHeader>
          <ProductForm onSave={(v) => createMutation.mutate(v)} saving={createMutation.isPending} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit {editing?.productName}</DialogTitle></DialogHeader>
          {editing && (
            <ProductForm initial={editing} onSave={(v) => updateMutation.mutate({ id: editing.id, payload: v })} saving={updateMutation.isPending} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
