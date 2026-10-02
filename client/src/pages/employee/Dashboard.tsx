import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Clock, LogIn, LogOut, CalendarCheck, CalendarClock, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import StatCard from "@/components/shared/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { attendanceService } from "@/services/attendanceService";
import { leaveService } from "@/services/leaveService";

export default function EmployeeDashboard() {
  const { user } = useAuth();

  const { data: today, isLoading: loadingToday } = useQuery({
    queryKey: ["attendance", "today"],
    queryFn: attendanceService.today,
  });

  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ["attendance", "history", 30],
    queryFn: () => attendanceService.myHistory(30),
  });

  const { data: leaves, isLoading: loadingLeaves } = useQuery({
    queryKey: ["leave", "me"],
    queryFn: leaveService.myRequests,
  });

  const punchIn = today?.login_time ? format(new Date(today.login_time), "hh:mm a") : "--:--";
  const punchOut = today?.logout_time ? format(new Date(today.logout_time), "hh:mm a") : "--:--";

  const workingHoursToday =
    today?.working_hours != null
      ? `${today.working_hours.toFixed(2)}h`
      : today?.login_time
      ? "In progress"
      : "--";

  const attendancePercent =
    history && history.length > 0
      ? `${Math.round((history.filter((h) => h.status === "present" || h.status === "late").length / history.length) * 100)}%`
      : "--";

  const pendingLeaves = leaves?.filter((l) => l.status === "pending").length ?? 0;
  const approvedLeaves = leaves?.filter((l) => l.status === "approved").length ?? 0;

  // Last 7 attendance records, oldest first, reshaped for the chart.
  const weeklyHours = (history ?? [])
    .slice(0, 7)
    .slice()
    .reverse()
    .map((h) => ({ day: format(new Date(h.date), "EEE"), hours: h.working_hours ?? 0 }));

  const isLoading = loadingToday || loadingHistory || loadingLeaves;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back{user ? `, ${user.email.split("@")[0]}` : ""} 👋</h1>
        <p className="text-sm text-muted-foreground">Here's your activity summary for today.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Punch In" value={loadingToday ? "…" : punchIn} icon={LogIn} accent="success" delay={0.0} />
        <StatCard label="Punch Out" value={loadingToday ? "…" : punchOut} icon={LogOut} accent="warning" delay={0.05} />
        <StatCard label="Working Hours" value={loadingToday ? "…" : workingHoursToday} icon={Clock} accent="primary" delay={0.1} />
        <StatCard label="Attendance %" value={loadingHistory ? "…" : attendancePercent} icon={TrendingUp} accent="success" delay={0.15} />
        <StatCard label="Pending Leaves" value={loadingLeaves ? "…" : pendingLeaves} icon={CalendarClock} accent="warning" delay={0.2} />
        <StatCard label="Approved Leaves" value={loadingLeaves ? "…" : approvedLeaves} icon={CalendarCheck} accent="success" delay={0.25} />
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Recent Working Hours</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {isLoading ? (
            <p className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading…</p>
          ) : weeklyHours.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No attendance records yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyHours}>
                <defs>
                  <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="day" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="hours" stroke="hsl(var(--primary))" fill="url(#hoursGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
