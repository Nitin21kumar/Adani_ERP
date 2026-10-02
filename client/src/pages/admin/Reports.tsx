import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  FileSpreadsheet,
  FileText,
  FileDown,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  Users,
  Building2,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils/cn";
import { reportService, type ReportType } from "@/services/reportService";
import { departmentService } from "@/services/employeeService";

const REPORT_TABS: { id: ReportType; label: string; icon: typeof CalendarCheck }[] = [
  { id: "attendance", label: "Attendance", icon: CalendarCheck },
  { id: "leave", label: "Leave", icon: CalendarDays },
  { id: "daily-reports", label: "Daily Work", icon: ClipboardList },
  { id: "employees", label: "Employees", icon: Users },
  { id: "departments", label: "Departments", icon: Building2 },
  { id: "monthly", label: "Monthly", icon: TrendingUp },
];

const now = new Date();

export default function AdminReports() {
  const [activeTab, setActiveTab] = useState<ReportType>("attendance");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [exporting, setExporting] = useState<string | null>(null);

  const { data: departments } = useQuery({ queryKey: ["departments"], queryFn: departmentService.list });

  const filterParams =
    activeTab === "monthly"
      ? { year, month }
      : activeTab === "employees" || activeTab === "departments"
        ? {}
        : { date_from: dateFrom || undefined, date_to: dateTo || undefined };

  const { data: rows, isLoading } = useQuery({
    queryKey: ["report-preview", activeTab, filterParams],
    queryFn: () => reportService.preview(activeTab, filterParams),
  });

  const handleExport = async (format: "csv" | "excel" | "pdf") => {
    setExporting(format);
    try {
      await reportService.export(activeTab, format, filterParams);
      toast.success(`${format.toUpperCase()} export downloaded.`);
    } catch {
      toast.error("Export failed. Please try again.");
    } finally {
      setExporting(null);
    }
  };

  const columns = rows && rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports & Export</h1>
        <p className="text-sm text-muted-foreground">Generate and export reports across every module.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {REPORT_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-secondary"
            )}
          >
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <Card className="glass">
          <CardContent className="flex flex-wrap items-end gap-4 p-5">
            {activeTab === "monthly" ? (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">Year</Label>
                  <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="w-28" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Month</Label>
                  <select
                    className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {new Date(2000, m - 1).toLocaleString("default", { month: "long" })}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : activeTab !== "employees" && activeTab !== "departments" ? (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">From</Label>
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">To</Label>
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No date filter needed for this report.</p>
            )}

            <div className="ml-auto flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleExport("csv")} disabled={exporting !== null}>
                <FileDown className="h-3.5 w-3.5" /> {exporting === "csv" ? "Exporting…" : "CSV"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleExport("excel")} disabled={exporting !== null}>
                <FileSpreadsheet className="h-3.5 w-3.5" /> {exporting === "excel" ? "Exporting…" : "Excel"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleExport("pdf")} disabled={exporting !== null}>
                <FileText className="h-3.5 w-3.5" /> {exporting === "pdf" ? "Exporting…" : "PDF"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Preview {rows ? `(${rows.length} rows)` : ""}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                {columns.map((col) => (
                  <th key={col} className="whitespace-nowrap px-6 py-3 font-medium capitalize">
                    {col.replace(/_/g, " ")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={columns.length || 1} className="px-6 py-8 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {rows?.map((row, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0">
                  {columns.map((col) => (
                    <td key={col} className="whitespace-nowrap px-6 py-3">{String(row[col])}</td>
                  ))}
                </tr>
              ))}
              {!isLoading && !rows?.length && (
                <tr><td colSpan={columns.length || 1} className="px-6 py-8 text-center text-muted-foreground">No data for the selected filters.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
