import { useQuery } from "@tanstack/react-query";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  CalendarDays,
  Home,
  CalendarClock,
  FileText,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import StatCard from "@/components/shared/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { reportsService } from "@/services/reportsService";

const COLORS = ["hsl(221,83%,53%)", "hsl(160,60%,45%)", "hsl(38,92%,50%)", "hsl(280,65%,60%)", "hsl(340,75%,55%)"];

function ChartEmpty({ message }: { message: string }) {
  return <p className="flex h-full items-center justify-center text-sm text-muted-foreground">{message}</p>;
}

export default function AdminDashboard() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ["admin-dashboard-summary"],
    queryFn: reportsService.dashboardSummary,
  });

  const hasAttendanceData = (summary?.attendance_trend ?? []).some((d) => d.present || d.absent || d.late);
  const hasDepartmentData = (summary?.department_distribution ?? []).length > 0;
  const hasLeaveTrendData = (summary?.monthly_leave_trend ?? []).some((d) => d.leaves > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Organization-wide overview.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Employees" value={isLoading ? "…" : summary?.total_employees ?? 0} icon={Users} accent="primary" delay={0.0} />
        <StatCard label="Present Today" value={isLoading ? "…" : summary?.present_today ?? 0} icon={UserCheck} accent="success" delay={0.05} />
        <StatCard label="Absent" value={isLoading ? "…" : summary?.absent_today ?? 0} icon={UserX} accent="destructive" delay={0.1} />
        <StatCard label="Late" value={isLoading ? "…" : summary?.late_today ?? 0} icon={Clock} accent="warning" delay={0.15} />
        <StatCard label="On Leave" value={isLoading ? "…" : summary?.on_leave_today ?? 0} icon={CalendarDays} accent="warning" delay={0.2} />
        <StatCard label="WFH" value={isLoading ? "…" : summary?.wfh_today ?? 0} icon={Home} accent="primary" delay={0.25} />
        <StatCard label="Pending Leave" value={isLoading ? "…" : summary?.pending_leave_count ?? 0} icon={CalendarClock} accent="warning" delay={0.3} />
        <StatCard label="Pending Reports" value={isLoading ? "…" : summary?.pending_reports_count ?? 0} icon={FileText} accent="warning" delay={0.35} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Attendance Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {isLoading ? (
              <ChartEmpty message="Loading…" />
            ) : !hasAttendanceData ? (
              <ChartEmpty message="No attendance recorded yet." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary?.attendance_trend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="present" fill="hsl(160,60%,45%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="late" fill="hsl(38,92%,50%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="absent" fill="hsl(0,84%,60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Department Wise Employees</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {isLoading ? (
              <ChartEmpty message="Loading…" />
            ) : !hasDepartmentData ? (
              <ChartEmpty message="No departments with employees yet." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={summary?.department_distribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                    {(summary?.department_distribution ?? []).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="glass lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Leave Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {isLoading ? (
              <ChartEmpty message="Loading…" />
            ) : !hasLeaveTrendData ? (
              <ChartEmpty message="No leave requests in the last 6 months." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={summary?.monthly_leave_trend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="leaves" stroke="hsl(221,83%,53%)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
