import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { conditionRatingService } from "@/services/audit/conditionRatingService";
import type { ConditionRating } from "@/types/audit";

function RatingRow({ rating }: { rating: ConditionRating }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(String(rating.valuationPercentage));

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<Pick<ConditionRating, "valuationPercentage" | "active">>) => conditionRatingService.update(rating.id, payload),
    onSuccess: () => {
      toast.success(`${rating.name} updated.`);
      queryClient.invalidateQueries({ queryKey: ["audit", "condition-ratings"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to update"),
  });

  return (
    <tr className="border-b border-border/50 last:border-0">
      <td className="px-6 py-3 font-medium">{rating.name}</td>
      <td className="px-6 py-3">
        <div className="flex items-center gap-2">
          <Input type="number" step="0.1" min="0" max="100" value={value} onChange={(e) => setValue(e.target.value)} className="w-24" />
          <span className="text-muted-foreground">%</span>
        </div>
      </td>
      <td className="px-6 py-3">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="h-4 w-4 rounded border-border" checked={rating.active} onChange={(e) => updateMutation.mutate({ active: e.target.checked })} />
          Active
        </label>
      </td>
      <td className="px-6 py-3">
        <Button
          size="sm"
          variant="outline"
          disabled={updateMutation.isPending || Number(value) === rating.valuationPercentage}
          onClick={() => updateMutation.mutate({ valuationPercentage: Number(value) })}
        >
          {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save
        </Button>
      </td>
    </tr>
  );
}

export default function AuditAdminConditionRatings() {
  const { data, isLoading } = useQuery({ queryKey: ["audit", "condition-ratings"], queryFn: () => conditionRatingService.list() });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Condition Ratings</h1>
        <p className="text-sm text-muted-foreground">Valuation percentages applied to base cost to compute tentative cost.</p>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Valuation Percentages</CardTitle>
          <CardDescription>tentativeCost = baseCost × valuation % ÷ 100</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Condition</th>
                <th className="px-6 py-3 font-medium">Valuation %</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">Loading…</td></tr>}
              {data?.map((rating) => <RatingRow key={rating.id} rating={rating} />)}
              {!isLoading && !data?.length && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    No condition ratings yet. Run <code className="rounded bg-secondary px-1.5 py-0.5">npm run seed:audit</code> in server/ to load the defaults.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
