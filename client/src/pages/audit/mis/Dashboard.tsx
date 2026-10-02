import { useQuery } from "@tanstack/react-query";
import { Clock, BadgeCheck, IndianRupee, AlertTriangle } from "lucide-react";
import StatCard from "@/components/shared/StatCard";
import { auditDashboardService } from "@/services/audit/dashboardService";

export default function MisDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ["audit", "dashboard-summary"], queryFn: auditDashboardService.summary });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">MIS Dashboard</h1>
        <p className="text-sm text-muted-foreground">Verifications awaiting your review and approved valuations.</p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Pending Review" value={data?.pending_verifications ?? 0} icon={Clock} accent="warning" />
          <StatCard label="Approved" value={data?.mis_approved_verifications ?? 0} icon={BadgeCheck} accent="success" delay={0.05} />
          <StatCard label="Total Actual Valuation" value={`₹${(data?.total_actual_valuation ?? 0).toLocaleString()}`} icon={IndianRupee} accent="primary" delay={0.1} />
          <StatCard label="Damaged Assets" value={data?.damaged_assets_count ?? 0} icon={AlertTriangle} accent="destructive" delay={0.15} />
        </div>
      )}
    </div>
  );
}
