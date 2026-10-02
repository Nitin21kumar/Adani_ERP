import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save, Send, AlertCircle, Plus, CheckCheck, PackageSearch } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import VerificationStatusBadge from "@/components/audit/VerificationStatusBadge";
import ImageUploader from "@/components/audit/ImageUploader";
import { auditTaskService } from "@/services/audit/taskService";
import { auditProductService } from "@/services/audit/productService";
import { damageCriteriaService } from "@/services/audit/damageCriteriaService";
import { conditionRatingService } from "@/services/audit/conditionRatingService";
import { auditVerificationService } from "@/services/audit/verificationService";
import { cn } from "@/utils/cn";
import type { PhotoLocation } from "@/types/audit";

const REMARKS_MANDATORY_RATINGS = ["Poor", "Non-functional", "Obsolete / Missing"];
const EDITABLE_STATUSES = ["draft", "returned_for_correction"];
const OTHER_PRODUCT_VALUE = "__other__";
const emptyForm = {
  productId: "",
  isOtherProduct: false,
  otherProductName: "",
  customSubProductName: "",
  selectedDamageCriteria: [] as string[],
  conditionRatingId: "",
  baseCost: "",
  remarks: "",
};

export default function AuditorVerify() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const taskId = searchParams.get("taskId");
  const verificationId = searchParams.get("verificationId");

  const [form, setForm] = useState(emptyForm);
  const autoCreatingRef = useRef(false);

  const { data: verification, isLoading: verificationLoading } = useQuery({
    queryKey: ["audit", "verification", verificationId],
    queryFn: () => auditVerificationService.get(verificationId!),
    enabled: !!verificationId,
  });

  // A task is one location/site visit and can cover several assets — this
  // loads every verification the auditor has already logged under it, so
  // they can jump between assets or start another one without losing track.
  const effectiveTaskId = verification?.auditTask.id || taskId || undefined;
  const { data: siblings } = useQuery({
    queryKey: ["audit", "my-verifications", "by-task", effectiveTaskId],
    queryFn: () => auditVerificationService.myVerifications({ auditTask: effectiveTaskId, limit: 100 }),
    enabled: !!effectiveTaskId,
  });

  const { data: myTasks } = useQuery({ queryKey: ["audit", "my-tasks", "for-verify"], queryFn: () => auditTaskService.myTasks({ limit: 200 }) });
  const { data: products } = useQuery({ queryKey: ["audit", "products", "active"], queryFn: () => auditProductService.list({ active: true, limit: 500 }) });
  const { data: damageCriteria } = useQuery({ queryKey: ["audit", "damage-criteria", "active"], queryFn: () => damageCriteriaService.list({ active: true, limit: 200 }) });
  const { data: conditionRatings } = useQuery({ queryKey: ["audit", "condition-ratings", "active"], queryFn: () => conditionRatingService.list({ active: true }) });

  const task = verification?.auditTask || myTasks?.items.find((t) => t.id === effectiveTaskId);

  // Convenience: if exactly one editable draft already exists under this
  // task and nothing is explicitly selected yet, open straight into it
  // (keeps the common one-asset-per-task case a single click). With two or
  // more, stay on the picker below instead of guessing which one to open.
  useEffect(() => {
    if (verificationId || !taskId || !siblings) return;
    const editable = siblings.items.filter((v) => EDITABLE_STATUSES.includes(v.status));
    if (editable.length === 1) setSearchParams({ verificationId: editable[0].id }, { replace: true });
  }, [siblings, verificationId, taskId, setSearchParams]);

  useEffect(() => {
    if (!verification) { setForm(emptyForm); return; }
    setForm({
      productId: verification.product?.id || "",
      isOtherProduct: verification.isOtherProduct,
      otherProductName: verification.isOtherProduct ? verification.productName : "",
      customSubProductName: verification.customSubProductName || "",
      selectedDamageCriteria: verification.selectedDamageCriteria.map((d) => d.id),
      conditionRatingId: verification.conditionRating?.id || "",
      baseCost: String(verification.baseCost),
      remarks: verification.remarks || "",
    });
  }, [verification]);

  const invalidateLists = () => {
    queryClient.invalidateQueries({ queryKey: ["audit", "my-tasks"] });
    queryClient.invalidateQueries({ queryKey: ["audit", "my-verifications"] });
    queryClient.invalidateQueries({ queryKey: ["audit", "dashboard-summary"] });
  };

  const createMutation = useMutation({
    mutationFn: auditVerificationService.create,
    onSuccess: (created) => {
      queryClient.setQueryData(["audit", "verification", created.id], created);
      setSearchParams({ verificationId: created.id }, { replace: true });
      invalidateLists();
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to save draft"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => auditVerificationService.update(id, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(["audit", "verification", updated.id], updated);
      invalidateLists();
      toast.success("Draft saved.");
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to save draft"),
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => auditVerificationService.submit(id),
    onSuccess: (updated) => {
      queryClient.setQueryData(["audit", "verification", updated.id], updated);
      invalidateLists();
      toast.success("Submitted to MIS for review.");
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to submit"),
  });

  const completeTaskMutation = useMutation({
    mutationFn: (id: string) => auditTaskService.completeMyTask(id),
    onSuccess: () => {
      invalidateLists();
      toast.success("Task marked complete.");
      navigate("/audit/auditor/dashboard");
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to complete task"),
  });

  const buildPayload = () =>
    form.isOtherProduct
      ? {
          isOtherProduct: true,
          productName: form.otherProductName,
          selectedDamageCriteria: form.selectedDamageCriteria,
          conditionRatingId: form.conditionRatingId || undefined,
          baseCost: form.baseCost ? Number(form.baseCost) : undefined,
          remarks: form.remarks || undefined,
        }
      : {
          productId: form.productId,
          customSubProductName: form.customSubProductName || undefined,
          selectedDamageCriteria: form.selectedDamageCriteria,
          conditionRatingId: form.conditionRatingId || undefined,
          baseCost: form.baseCost ? Number(form.baseCost) : undefined,
          remarks: form.remarks || undefined,
        };

  const handleSaveDraft = async () => {
    if (form.isOtherProduct ? !form.otherProductName.trim() : !form.productId) return toast.error("Product is mandatory");
    if (verification) {
      updateMutation.mutate({ id: verification.id, payload: buildPayload() });
    } else if (effectiveTaskId) {
      await createMutation.mutateAsync({ auditTaskId: effectiveTaskId, ...buildPayload() });
      toast.success("Draft saved.");
    }
  };

  // Auto-creates the draft the moment a product is picked — the auditor
  // shouldn't have to click "Save Draft" before the camera/gallery buttons
  // below become usable; photos are often the very first thing captured.
  const handleProductSelect = async (value: string) => {
    if (value === OTHER_PRODUCT_VALUE) {
      setForm((f) => ({ ...f, productId: "", isOtherProduct: true, customSubProductName: "" }));
      return;
    }
    const product = products?.items.find((p) => p.id === value);
    setForm((f) => ({ ...f, productId: value, isOtherProduct: false, otherProductName: "", baseCost: product ? String(product.defaultBaseCost) : f.baseCost, customSubProductName: "" }));

    if (!value || verification || verificationId || !effectiveTaskId || autoCreatingRef.current) return;
    autoCreatingRef.current = true;
    try {
      await createMutation.mutateAsync({ auditTaskId: effectiveTaskId, productId: value, baseCost: product?.defaultBaseCost });
      toast.success("Draft started — you can now add photos.");
    } catch {
      // createMutation's onError already surfaced the toast.
    } finally {
      autoCreatingRef.current = false;
    }
  };

  // For "Other / Not Listed" there's no product to draw a default base cost
  // from, so the draft can't be created until both the name and a base cost
  // are present — this fires from either field's onBlur, whichever the
  // auditor finishes second.
  const tryAutoCreateOtherProduct = async () => {
    if (!form.isOtherProduct || verification || verificationId || !effectiveTaskId || autoCreatingRef.current) return;
    const productName = form.otherProductName.trim();
    const baseCost = Number(form.baseCost);
    if (!productName || !(baseCost > 0)) return;
    autoCreatingRef.current = true;
    try {
      await createMutation.mutateAsync({ auditTaskId: effectiveTaskId, isOtherProduct: true, productName, baseCost });
      toast.success("Draft started — you can now add photos.");
    } catch {
      // createMutation's onError already surfaced the toast.
    } finally {
      autoCreatingRef.current = false;
    }
  };

  const handleSubmit = async () => {
    if (!verification) return toast.error("Save as draft first");
    // Persist any edits still sitting in local form state first — without
    // this, a field changed right before clicking Submit (e.g. condition
    // rating) would silently be lost instead of submitted.
    try {
      await updateMutation.mutateAsync({ id: verification.id, payload: buildPayload() });
    } catch {
      return; // updateMutation's onError already surfaced the toast
    }
    submitMutation.mutate(verification.id);
  };

  const handleAddAnotherAsset = () => {
    setForm(emptyForm);
    setSearchParams({ taskId: effectiveTaskId! }, { replace: true });
  };

  const handleCompleteTask = () => {
    if (!effectiveTaskId) return;
    const stillOpen = siblings?.items.filter((v) => EDITABLE_STATUSES.includes(v.status)).length || 0;
    const warning = stillOpen
      ? `${stillOpen} asset(s) under this task are still draft/returned and will be locked. Mark this task complete anyway?`
      : "Mark this task complete? You won't be able to add or edit assets under it afterward.";
    if (confirm(warning)) completeTaskMutation.mutate(effectiveTaskId);
  };

  const selectedProduct = products?.items.find((p) => p.id === form.productId);
  const selectedRating = conditionRatings?.find((r) => r.id === form.conditionRatingId);
  const previewTentative = selectedRating && form.baseCost ? Math.round((Number(form.baseCost) * selectedRating.valuationPercentage)) / 100 : verification?.tentativeCost ?? 0;
  const remarksRequired = (selectedRating && REMARKS_MANDATORY_RATINGS.includes(selectedRating.name)) || form.selectedDamageCriteria.length > 0;

  const taskCompleted = task?.status === "completed";
  const readOnly = taskCompleted || (!!verification && !EDITABLE_STATUSES.includes(verification.status));
  const saving = createMutation.isPending || updateMutation.isPending;

  if (!taskId && !verificationId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Verify Asset</h1>
        <Card className="glass"><CardContent className="p-10 text-center text-muted-foreground">
          Open this page from a task on your <a href="/audit/auditor/dashboard" className="text-primary hover:underline">Dashboard</a> to start or continue a verification.
        </CardContent></Card>
      </div>
    );
  }

  if (verificationId && verificationLoading) {
    return <div className="py-16 text-center text-muted-foreground">Loading verification…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Verify Asset</h1>
          <p className="text-sm text-muted-foreground">Task {task?.taskCode}{task?.title ? ` — ${task.title}` : ""}</p>
        </div>
        {verification && <VerificationStatusBadge status={verification.status} />}
      </div>

      {/* One task can cover many assets at the same location — this lets the
          auditor see and jump between every asset already logged here. */}
      {siblings && siblings.items.length > 0 && (
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Assets at This Task ({siblings.total})</CardTitle>
            <CardDescription>One auditor can log multiple assets under the same task/location.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {siblings.items.map((v) => (
              <button
                key={v.id}
                onClick={() => setSearchParams({ verificationId: v.id }, { replace: true })}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  v.id === verification?.id ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"
                )}
              >
                <span className="font-medium">{v.productName}</span>
                <VerificationStatusBadge status={v.status} />
              </button>
            ))}
            {!taskCompleted && (
              <button
                onClick={handleAddAnotherAsset}
                className="flex items-center gap-2 rounded-lg border-2 border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary"
              >
                <Plus className="h-3.5 w-3.5" /> Add Another Asset
              </button>
            )}
          </CardContent>
        </Card>
      )}

      {taskCompleted && (
        <Card className="border-emerald-500/40 bg-emerald-500/5">
          <CardContent className="flex items-center gap-3 p-4 text-sm">
            <CheckCheck className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            This task has been marked complete. All assets under it are locked.
          </CardContent>
        </Card>
      )}

      {verification?.status === "returned_for_correction" && verification.misRemarks && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex gap-3 p-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-medium text-destructive">Returned by MIS for correction</p>
              <p className="text-sm text-muted-foreground">{verification.misRemarks}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="glass">
        <CardHeader>
          <CardTitle>Asset Details</CardTitle>
          <CardDescription>Product, damage, and condition — used to calculate the tentative valuation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Product *</Label>
            <select
              disabled={readOnly}
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm disabled:opacity-60"
              value={form.isOtherProduct ? OTHER_PRODUCT_VALUE : form.productId}
              onChange={(e) => handleProductSelect(e.target.value)}
            >
              <option value="">Select product</option>
              {products?.items.map((p) => (
                <option key={p.id} value={p.id}>{p.productName} ({p.category})</option>
              ))}
              <option value={OTHER_PRODUCT_VALUE}>Other / Not Listed…</option>
            </select>
          </div>

          {form.isOtherProduct ? (
            <div className="space-y-1.5">
              <Label>Product Name *</Label>
              <Input
                disabled={readOnly}
                placeholder="Type the product name"
                value={form.otherProductName}
                onChange={(e) => setForm((f) => ({ ...f, otherProductName: e.target.value }))}
                onBlur={tryAutoCreateOtherProduct}
              />
              <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400">
                <PackageSearch className="h-4 w-4 shrink-0" />
                Not in Product Master yet — MIS will be notified when you submit, so they can add it.
              </div>
            </div>
          ) : (
            selectedProduct?.allowCustomSubProduct && (
              <div className="space-y-1.5">
                <Label>Sub-product / Other Product Name</Label>
                <Input disabled={readOnly} value={form.customSubProductName} onChange={(e) => setForm((f) => ({ ...f, customSubProductName: e.target.value }))} />
              </div>
            )
          )}

          <div className="space-y-1.5">
            <Label>Damage Criteria (select all that apply)</Label>
            <div className="grid grid-cols-1 gap-2 rounded-md border border-border p-3 sm:grid-cols-2">
              {damageCriteria?.items.map((d) => (
                <label key={d.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border"
                    disabled={readOnly}
                    checked={form.selectedDamageCriteria.includes(d.id)}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        selectedDamageCriteria: e.target.checked ? [...f.selectedDamageCriteria, d.id] : f.selectedDamageCriteria.filter((id) => id !== d.id),
                      }))
                    }
                  />
                  {d.name}
                </label>
              ))}
              {!damageCriteria?.items.length && <p className="text-sm text-muted-foreground">No damage criteria configured yet.</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Condition Rating *</Label>
              <select
                disabled={readOnly}
                className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm disabled:opacity-60"
                value={form.conditionRatingId}
                onChange={(e) => setForm((f) => ({ ...f, conditionRatingId: e.target.value }))}
              >
                <option value="">Select condition</option>
                {conditionRatings?.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} ({r.valuationPercentage}%)</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Base Cost (₹) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                disabled={readOnly}
                value={form.baseCost}
                onChange={(e) => setForm((f) => ({ ...f, baseCost: e.target.value }))}
                onBlur={tryAutoCreateOtherProduct}
              />
            </div>
          </div>

          <div className={cn("grid gap-4", verification?.actualCost !== undefined && verification.actualCost !== null ? "grid-cols-2" : "grid-cols-1")}>
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <p className="text-xs text-muted-foreground">Tentative Cost (auto-calculated)</p>
              <p className="text-xl font-bold">₹{previewTentative.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">baseCost × valuation % ÷ 100</p>
            </div>
            {verification?.actualCost !== undefined && verification.actualCost !== null && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
                <p className="text-xs text-muted-foreground">Actual Cost (set by MIS)</p>
                <p className="text-xl font-bold">₹{verification.actualCost.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{verification.misVerifier ? `Approved by ${verification.misVerifier.name}` : "Approved"}</p>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Remarks {remarksRequired && <span className="text-destructive">*</span>}</Label>
            <textarea
              disabled={readOnly}
              className="flex min-h-[90px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
              placeholder={remarksRequired ? "Required for this condition rating or selected damage criteria" : "Optional"}
              value={form.remarks}
              onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Photos {!readOnly && "*"}</CardTitle>
          <CardDescription>At least one photo is required before submitting to MIS.</CardDescription>
        </CardHeader>
        <CardContent>
          {verification ? (
            <ImageUploader
              images={verification.images}
              imageDetails={verification.imageDetails}
              disabled={readOnly}
              disabledHint={readOnly ? "this verification is no longer editable" : undefined}
              onUpload={async (files, location: PhotoLocation | undefined) => {
                const updated = await auditVerificationService.uploadImages(verification.id, files, location);
                queryClient.setQueryData(["audit", "verification", verification.id], updated);
              }}
              onDelete={async (url) => {
                const updated = await auditVerificationService.deleteImage(verification.id, url);
                queryClient.setQueryData(["audit", "verification", verification.id], updated);
              }}
            />
          ) : createMutation.isPending ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Preparing this asset for photos…
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Select a product above to start adding photos.</p>
          )}
        </CardContent>
      </Card>

      {!readOnly && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" className="flex-1" onClick={handleSaveDraft} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Draft
          </Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={submitMutation.isPending || updateMutation.isPending || !verification}>
            {submitMutation.isPending || updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Submit to MIS
          </Button>
        </div>
      )}

      {!taskCompleted && effectiveTaskId && (
        <Card className="glass">
          <CardContent className="flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Finished auditing every asset at this location?</p>
              <p className="text-xs text-muted-foreground">Marking the task complete locks every asset logged under it, including drafts.</p>
            </div>
            <Button variant="outline" onClick={handleCompleteTask} disabled={completeTaskMutation.isPending}>
              {completeTaskMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
              Mark Task Complete
            </Button>
          </CardContent>
        </Card>
      )}

      {readOnly && (
        <Button variant="outline" onClick={() => navigate("/audit/auditor/history")}>Back to History</Button>
      )}
    </div>
  );
}
