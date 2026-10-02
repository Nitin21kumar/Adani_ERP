import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/audit/Pagination";
import { auditMisService } from "@/services/audit/misService";

export default function MisPending() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [skip, setSkip] = useState(0);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["audit", "mis", "pending", search, skip],
    queryFn: () => auditMisService.pending({ search: search || undefined, limit, skip }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pending Verifications</h1>
        <p className="text-sm text-muted-foreground">Verifications submitted by auditors, awaiting MIS review.</p>
      </div>

      <Card className="glass">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by product name..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setSkip(0); }} />
          </div>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader><CardTitle>Awaiting Review {data ? `(${data.total})` : ""}</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Task</th>
                <th className="px-6 py-3 font-medium">Auditor</th>
                <th className="px-6 py-3 font-medium">Product</th>
                <th className="px-6 py-3 font-medium">Condition</th>
                <th className="px-6 py-3 font-medium">Tentative Cost</th>
                <th className="px-6 py-3 font-medium">Submitted</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">Loading…</td></tr>}
              {data?.items.map((v) => (
                <tr key={v.id} className="border-b border-border/50 last:border-0">
                  <td className="px-6 py-3 font-mono text-xs">{v.auditTask.taskCode}</td>
                  <td className="px-6 py-3 text-muted-foreground">{v.auditor.name}</td>
                  <td className="px-6 py-3 font-medium">
                    <div className="flex items-center gap-2">
                      {v.productName}
                      {v.isOtherProduct && (
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">New Product</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">{v.conditionRating?.name || "—"}</td>
                  <td className="px-6 py-3">₹{v.tentativeCost.toLocaleString()}</td>
                  <td className="px-6 py-3 text-muted-foreground">{v.auditorSubmittedAt ? new Date(v.auditorSubmittedAt).toLocaleDateString() : "—"}</td>
                  <td className="px-6 py-3">
                    <Button size="sm" onClick={() => navigate(`/audit/mis/verification/${v.id}`)}>Review</Button>
                  </td>
                </tr>
              ))}
              {!isLoading && !data?.items.length && (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">Nothing pending review.</td></tr>
              )}
            </tbody>
          </table>
          {data && <Pagination total={data.total} limit={limit} skip={skip} onSkipChange={setSkip} />}
        </CardContent>
      </Card>
    </div>
  );
}
