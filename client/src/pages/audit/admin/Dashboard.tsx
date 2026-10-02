import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { ClipboardList, CheckCircle2, Clock, BadgeCheck, IndianRupee, AlertTriangle, Download, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/shared/StatCard";
import { auditDashboardService } from "@/services/audit/dashboardService";
import { auditVerificationService } from "@/services/audit/verificationService";

const CONDITION_COLORS: Record<string, string> = {
  "Very Good": "hsl(160,60%,45%)",
  Good: "hsl(160,50%,55%)",
  Satisfactory: "hsl(199,70%,55%)",
  Repairable: "hsl(38,92%,50%)",
  Poor: "hsl(25,90%,55%)",
  "Non-functional": "hsl(0,84%,60%)",
  "Obsolete / Missing": "hsl(0,0%,55%)",
};

export default function AuditAdminDashboard() {
  const [exporting, setExporting] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ["audit", "dashboard-summary"], queryFn: auditDashboardService.summary });

  const handleExport = async () => {
    setExporting(true);
    try {
      await auditVerificationService.exportApprovedCsv();
      toast.success("Exported MIS-approved verifications as CSV.");
    } catch {
      toast.error("Failed to export CSV");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of asset audit tasks, verifications, and valuations.</p>
        </div>
        <Button onClick={handleExport} disabled={exporting}>
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export MIS-Approved CSV
        </Button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">Loading dashboard…</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Tasks" value={data?.total_tasks ?? 0} icon={ClipboardList} accent="primary" />
            <StatCard label="Completed Tasks" value={data?.completed_tasks ?? 0} icon={CheckCircle2} accent="success" />
            <StatCard label="Pending Verifications" value={data?.pending_verifications ?? 0} icon={Clock} accent="warning" delay={0.05} />
            <StatCard label="MIS Approved" value={data?.mis_approved_verifications ?? 0} icon={BadgeCheck} accent="success" delay={0.1} />
            <StatCard label="Total Tentative Valuation" value={`₹${(data?.total_tentative_valuation ?? 0).toLocaleString()}`} icon={IndianRupee} accent="primary" delay={0.15} />
            <StatCard label="Total Actual Valuation" value={`₹${(data?.total_actual_valuation ?? 0).toLocaleString()}`} icon={IndianRupee} accent="success" delay={0.2} />
            <StatCard label="Damaged Assets" value={data?.damaged_assets_count ?? 0} icon={AlertTriangle} accent="destructive" delay={0.25} />
            <StatCard label="Non-functional / Missing" value={(data?.non_functional_count ?? 0) + (data?.missing_count ?? 0)} icon={AlertTriangle} accent="destructive" delay={0.3} />
          </div>

          <Card className="glass">
            <CardHeader>
              <CardTitle>Condition-wise Verification Count</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              {data && Object.keys(data.condition_wise_count).length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(data.condition_wise_count).map(([name, count]) => ({ name, count }))}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" fontSize={11} interval={0} angle={-15} textAnchor="end" height={60} />
                    <YAxis fontSize={12} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {Object.keys(data.condition_wise_count).map((name) => (
                        <Cell key={name} fill={CONDITION_COLORS[name] || "hsl(221,83%,53%)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No verification data yet.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
