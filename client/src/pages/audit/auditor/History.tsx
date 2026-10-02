import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/audit/Pagination";
import VerificationStatusBadge from "@/components/audit/VerificationStatusBadge";
import { auditVerificationService } from "@/services/audit/verificationService";

export default function AuditorHistory() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [skip, setSkip] = useState(0);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["audit", "my-verifications", search, statusFilter, skip],
    queryFn: () => auditVerificationService.myVerifications({ search: search || undefined, status: statusFilter || undefined, limit, skip }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Verification History</h1>
        <p className="text-sm text-muted-foreground">Every asset verification you have created.</p>
      </div>

      <Card className="glass">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by product name..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setSkip(0); }} />
          </div>
          <select className="h-10 rounded-md border border-border bg-background px-3 text-sm" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setSkip(0); }}>
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="submitted_to_mis">Submitted to MIS</option>
            <option value="returned_for_correction">Returned for Correction</option>
            <option value="mis_approved">MIS Approved</option>
            <option value="closed">Closed</option>
          </select>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader><CardTitle>Verifications {data ? `(${data.total})` : ""}</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Task</th>
                <th className="px-6 py-3 font-medium">Product</th>
                <th className="px-6 py-3 font-medium">Condition</th>
                <th className="px-6 py-3 font-medium">Tentative Cost</th>
                <th className="px-6 py-3 font-medium">Actual Cost</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">Loading…</td></tr>}
              {data?.items.map((v) => (
                <tr key={v.id} className="border-b border-border/50 last:border-0">
                  <td className="px-6 py-3 font-mono text-xs">{v.auditTask.taskCode}</td>
                  <td className="px-6 py-3 font-medium">{v.productName}{v.customSubProductName ? ` — ${v.customSubProductName}` : ""}</td>
                  <td className="px-6 py-3 text-muted-foreground">{v.conditionRating?.name || "—"}</td>
                  <td className="px-6 py-3">₹{v.tentativeCost.toLocaleString()}</td>
                  <td className="px-6 py-3">{v.actualCost !== undefined && v.actualCost !== null ? `₹${v.actualCost.toLocaleString()}` : "—"}</td>
                  <td className="px-6 py-3"><VerificationStatusBadge status={v.status} /></td>
                  <td className="px-6 py-3">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/audit/auditor/verify?verificationId=${v.id}`)}>
                      {["draft", "returned_for_correction"].includes(v.status) ? "Continue" : "View"}
                    </Button>
                  </td>
                </tr>
              ))}
              {!isLoading && !data?.items.length && (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">No verifications yet.</td></tr>
              )}
            </tbody>
          </table>
          {data && <Pagination total={data.total} limit={limit} skip={skip} onSkipChange={setSkip} />}
        </CardContent>
      </Card>
    </div>
  );
}
