import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, CheckCircle2, RotateCcw, ArrowLeft, MapPin, PackageSearch } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import VerificationStatusBadge from "@/components/audit/VerificationStatusBadge";
import { auditMisService } from "@/services/audit/misService";
import { resolveAssetUrl } from "@/utils/assetUrl";

export default function MisVerificationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [actualCost, setActualCost] = useState("");
  const [misRemarks, setMisRemarks] = useState("");
  const [returning, setReturning] = useState(false);

  const { data: verification, isLoading } = useQuery({ queryKey: ["audit", "mis-verification", id], queryFn: () => auditMisService.get(id!), enabled: !!id });

  useEffect(() => {
    if (verification) {
      setActualCost(String(verification.actualCost ?? verification.tentativeCost));
      setMisRemarks(verification.misRemarks || "");
    }
  }, [verification]);

  const approveMutation = useMutation({
    mutationFn: () => auditMisService.approve(id!, { actualCost: Number(actualCost), misRemarks: misRemarks || undefined }),
    onSuccess: () => {
      toast.success("Verification approved.");
      queryClient.invalidateQueries({ queryKey: ["audit", "mis"] });
      queryClient.invalidateQueries({ queryKey: ["audit", "dashboard-summary"] });
      navigate("/audit/mis/pending");
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to approve"),
  });

  const returnMutation = useMutation({
    mutationFn: () => auditMisService.return(id!, misRemarks),
    onSuccess: () => {
      toast.success("Returned to auditor for correction.");
      queryClient.invalidateQueries({ queryKey: ["audit", "mis"] });
      queryClient.invalidateQueries({ queryKey: ["audit", "dashboard-summary"] });
      navigate("/audit/mis/pending");
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to return verification"),
  });

  if (isLoading) return <div className="py-16 text-center text-muted-foreground">Loading verification…</div>;
  if (!verification) return <div className="py-16 text-center text-muted-foreground">Verification not found.</div>;

  const canDecide = verification.status === "submitted_to_mis";
  const noImages = verification.images.length === 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/audit/mis/pending")}>
          <ArrowLeft className="h-4 w-4" /> Back to Pending
        </Button>
        <VerificationStatusBadge status={verification.status} />
      </div>

      {verification.isOtherProduct && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <PackageSearch className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Product not in Product Master</p>
                <p className="text-sm text-muted-foreground">The auditor typed "{verification.productName}" manually. Add it so future audits can select it directly.</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/audit/mis/products")}>Go to Product Master</Button>
          </CardContent>
        </Card>
      )}

      <Card className="glass">
        <CardHeader>
          <CardTitle>{verification.productName}{verification.customSubProductName ? ` — ${verification.customSubProductName}` : ""}</CardTitle>
          <CardDescription>Task {verification.auditTask.taskCode} · Auditor {verification.auditor.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Condition Rating</p>
              <p className="font-medium">{verification.conditionRating?.name || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Base Cost</p>
              <p className="font-medium">₹{verification.baseCost.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tentative Cost</p>
              <p className="font-medium">₹{verification.tentativeCost.toLocaleString()}</p>
            </div>
            {verification.actualCost !== undefined && verification.actualCost !== null && (
              <div>
                <p className="text-xs text-muted-foreground">Actual Cost (Approved)</p>
                <p className="font-medium text-emerald-600 dark:text-emerald-400">₹{verification.actualCost.toLocaleString()}</p>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Damage Criteria</p>
            <p className="text-sm">{verification.selectedDamageCriteria.length ? verification.selectedDamageCriteria.map((d) => d.name).join(", ") : "None selected"}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Auditor Remarks</p>
            <p className="text-sm">{verification.remarks || "—"}</p>
          </div>

          {verification.misRemarks && (
            <div>
              <p className="text-xs text-muted-foreground">MIS Remarks</p>
              <p className="text-sm">{verification.misRemarks}</p>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs text-muted-foreground">Photos ({verification.images.length})</p>
            {verification.images.length ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {verification.images.map((url) => {
                  const location = verification.imageDetails?.find((d) => d.imageUrl === url)?.location;
                  return (
                    <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-secondary">
                      <a href={resolveAssetUrl(url) ?? undefined} target="_blank" rel="noreferrer" className="block h-full w-full">
                        <img src={resolveAssetUrl(url) ?? undefined} alt="Asset evidence" className="h-full w-full object-cover" />
                      </a>
                      {location && (
                        <a
                          href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-medium text-white hover:bg-black/80"
                          title="View capture location"
                        >
                          <MapPin className="h-3 w-3" /> Location
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-destructive">No photos were attached — approval is blocked until the auditor adds at least one.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {canDecide && (
        <Card className="glass">
          <CardHeader>
            <CardTitle>MIS Decision</CardTitle>
            <CardDescription>Approve the tentative cost as-is, adjust it, or return the verification for correction.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Actual Cost (₹)</Label>
              <Input type="number" min="0" step="0.01" value={actualCost} onChange={(e) => setActualCost(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>MIS Remarks {returning && <span className="text-destructive">*</span>}</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder={returning ? "Required — explain what needs correction" : "Optional note for the audit trail"}
                value={misRemarks}
                onChange={(e) => setMisRemarks(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                className="flex-1"
                disabled={noImages || approveMutation.isPending || !(Number(actualCost) >= 0)}
                onClick={() => approveMutation.mutate()}
              >
                {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Approve
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                disabled={returnMutation.isPending}
                onClick={() => {
                  if (!returning) { setReturning(true); return; }
                  if (!misRemarks.trim()) { toast.error("MIS remarks are required when returning a verification"); return; }
                  returnMutation.mutate();
                }}
              >
                {returnMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                {returning ? "Confirm Return" : "Return for Correction"}
              </Button>
            </div>
            {noImages && <p className="text-xs text-destructive">Cannot approve — at least one photo is required.</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
