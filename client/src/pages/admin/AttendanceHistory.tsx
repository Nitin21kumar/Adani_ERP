import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Filter, MapPin, ShieldAlert, Camera, Map as MapIcon, Table as TableIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AttendanceMap from "@/components/shared/AttendanceMap";
import { attendanceService } from "@/services/attendanceService";
import { employeeService } from "@/services/employeeService";
import { resolveAssetUrl } from "@/utils/assetUrl";
import type { Attendance, AttendanceFilters } from "@/types/attendance";

function LocationLink({ event, attendance }: { event: "login" | "logout"; attendance: Attendance }) {
  const loc = attendance.locations?.find((l) => l.event_type === event);
  if (!loc) {
    // Punch-in always has one by the time it's recorded; punch-out only
    // once the employee has actually punched out.
    return <span className="text-muted-foreground">{event === "logout" && !attendance.logout_time ? "—" : "Not shared"}</span>;
  }
  return (
    <a
      href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
      target="_blank"
      rel="noreferrer"
      title={loc.full_address ?? undefined}
      className="inline-flex items-center gap-1 text-primary hover:underline"
    >
      <MapPin className="h-3.5 w-3.5" /> {loc.full_address ? "View" : "Coordinates"}
    </a>
  );
}

function VerificationPhoto({ event, attendance }: { event: "login" | "logout"; attendance: Attendance }) {
  const url = event === "login" ? attendance.login_verification_photo_url : attendance.logout_verification_photo_url;
  const status = event === "login" ? attendance.login_verification_photo_status : attendance.logout_verification_photo_status;

  if (status === "captured" && url) {
    return (
      <a
        href={resolveAssetUrl(url) ?? undefined}
        target="_blank"
        rel="noreferrer"
        title="View captured verification photo"
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border"
      >
        <img src={resolveAssetUrl(url)!} alt="Verification" className="h-full w-full object-cover" />
      </a>
    );
  }
  if (status) {
    return (
      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400" title={`Reason: ${status}`}>
        <ShieldAlert className="h-3.5 w-3.5" /> Flagged
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <Camera className="h-3.5 w-3.5" /> —
    </span>
  );
}

export default function AdminAttendanceHistory() {
  const [filters, setFilters] = useState<AttendanceFilters>({});
  const [view, setView] = useState<"table" | "map">("table");

  const { data: records, isLoading } = useQuery({
    queryKey: ["admin-attendance-history", filters],
    queryFn: () => attendanceService.list(filters),
  });

  const { data: employees } = useQuery({ queryKey: ["employees-for-filter"], queryFn: () => employeeService.list({}) });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance History</h1>
          <p className="text-sm text-muted-foreground">
            Every Punch In / Punch Out — time, location, and identity verification photo, for every employee.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant={view === "table" ? "default" : "outline"} size="sm" onClick={() => setView("table")}>
            <TableIcon className="h-4 w-4" /> Table
          </Button>
          <Button variant={view === "map" ? "default" : "outline"} size="sm" onClick={() => setView("map")}>
            <MapIcon className="h-4 w-4" /> Map
          </Button>
        </div>
      </div>

      <Card className="glass">
        <CardContent className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1 text-xs"><Filter className="h-3 w-3" /> Employee</Label>
            <select
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              onChange={(e) => setFilters((f) => ({ ...f, employee_id: e.target.value || undefined }))}
            >
              <option value="">All employees</option>
              {employees?.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name} ({emp.email})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">From</Label>
            <Input type="date" onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value || undefined }))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">To</Label>
            <Input type="date" onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value || undefined }))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <select
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}
            >
              <option value="">All</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
              <option value="leave">On Leave</option>
              <option value="wfh">WFH</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {view === "table" ? (
        <Card className="glass">
          <CardHeader>
            <CardTitle>Records {records ? `(${records.length})` : ""}</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-medium">Employee</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Punch In</th>
                  <th className="px-6 py-3 font-medium">Punch In Location</th>
                  <th className="px-6 py-3 font-medium">Punch In Photo</th>
                  <th className="px-6 py-3 font-medium">Punch Out</th>
                  <th className="px-6 py-3 font-medium">Punch Out Location</th>
                  <th className="px-6 py-3 font-medium">Punch Out Photo</th>
                  <th className="px-6 py-3 font-medium">Hours</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-muted-foreground">Loading…</td>
                  </tr>
                )}
                {!isLoading && !records?.length && (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-muted-foreground">No records found.</td>
                  </tr>
                )}
                {records?.map((row) => (
                  <tr key={row.id} className="border-b border-border/50 last:border-0">
                    <td className="px-6 py-3">
                      <div className="font-medium">{row.employee?.full_name || row.employee_id}</div>
                      <div className="text-xs text-muted-foreground">{row.employee?.employee_code}</div>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">{format(new Date(row.date), "dd MMM yyyy")}</td>
                    <td className="px-6 py-3 whitespace-nowrap">{row.login_time ? format(new Date(row.login_time), "hh:mm a") : "--"}</td>
                    <td className="px-6 py-3"><LocationLink event="login" attendance={row} /></td>
                    <td className="px-6 py-3"><VerificationPhoto event="login" attendance={row} /></td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      {row.logout_time ? (
                        format(new Date(row.logout_time), "hh:mm a")
                      ) : row.login_time ? (
                        <span className="text-emerald-600 dark:text-emerald-400">Active</span>
                      ) : (
                        "--"
                      )}
                    </td>
                    <td className="px-6 py-3"><LocationLink event="logout" attendance={row} /></td>
                    <td className="px-6 py-3"><VerificationPhoto event="logout" attendance={row} /></td>
                    <td className="px-6 py-3">{row.working_hours ?? "--"}</td>
                    <td className="px-6 py-3">
                      <span
                        className={
                          row.status === "late"
                            ? "rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600"
                            : "rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium capitalize text-emerald-600"
                        }
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass">
          <CardHeader>
            <CardTitle>Punch In / Punch Out Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <AttendanceMap records={records || []} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
