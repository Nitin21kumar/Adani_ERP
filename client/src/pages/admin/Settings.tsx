import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Building2, Clock, CalendarDays, Mail, ShieldCheck, Loader2, Plus, Trash2, Save, Upload, ImageOff, Database, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils/cn";
import { settingsService } from "@/services/settingsService";
import { uploadService } from "@/services/uploadService";
import { resolveAssetUrl } from "@/utils/assetUrl";
import type { CompanySettingsUpdate } from "@/types/settings";

const MAX_LOGO_MB = 2;
const ACCEPTED_LOGO_TYPES = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];

const TABS = [
  { id: "company", label: "Company Details", icon: Building2 },
  { id: "timing", label: "Office Timing", icon: Clock },
  { id: "holidays", label: "Holiday Calendar", icon: CalendarDays },
  { id: "smtp", label: "SMTP", icon: Mail },
  { id: "password", label: "Password Policy", icon: ShieldCheck },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<TabId>("company");
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({ queryKey: ["company-settings"], queryFn: settingsService.getCompany });

  const { register, handleSubmit, reset, setValue, watch } = useForm<CompanySettingsUpdate>();
  const logoUrl = watch("logo_url");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (settings) reset(settings);
  }, [settings, reset]);

  const updateMutation = useMutation({
    mutationFn: settingsService.updateCompany,
    onSuccess: () => {
      toast.success("Settings saved.");
      queryClient.invalidateQueries({ queryKey: ["company-settings"] });
      // The logo is used everywhere (login, sidebar, navbar, reports, emails) via
      // its own cached query — refresh that too so the change shows up immediately.
      queryClient.invalidateQueries({ queryKey: ["company-branding-public"] });
    },
    onError: () => toast.error("Failed to save settings"),
  });

  const cleanupMutation = useMutation({
    mutationFn: settingsService.runTempImageCleanup,
    onSuccess: (data) => toast.success(`Cleanup complete: ${data.deleted} file(s) removed.`),
    onError: () => toast.error("Cleanup failed. Check server logs."),
  });

  const {
    data: auditReport,
    isFetching: auditLoading,
    refetch: refetchAudit,
  } = useQuery({
    queryKey: ["db-audit"],
    queryFn: settingsService.getDatabaseAudit,
    enabled: activeTab === "password",
    staleTime: 60 * 1000,
  });

  const handleLogoFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      toast.error("Please upload a PNG, JPG, WEBP, or SVG image.");
      return;
    }
    if (file.size > MAX_LOGO_MB * 1024 * 1024) {
      toast.error(`Logo must be smaller than ${MAX_LOGO_MB}MB.`);
      return;
    }

    setUploadingLogo(true);
    try {
      const url = await uploadService.upload(file, "company_logos");
      setValue("logo_url", url, { shouldDirty: true });
      toast.success("Logo uploaded. Click Save Changes to apply it everywhere.");
    } catch {
      toast.error("Logo upload failed. Please try again.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const onSubmit = (values: CompanySettingsUpdate) => {
    // Only send fields relevant to the active tab's section to avoid overwriting others unintentionally.
    updateMutation.mutate(values);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure company-wide policies and preferences.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
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

      {isLoading ? (
        <p className="text-muted-foreground">Loading settings…</p>
      ) : (
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {activeTab === "company" && (
            <Card className="glass">
              <CardHeader><CardTitle>Company Details</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Company Name</Label>
                    <Input {...register("company_name")} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Company Logo</Label>
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-secondary/40">
                        {resolveAssetUrl(logoUrl) ? (
                          <img src={resolveAssetUrl(logoUrl)!} alt="Company logo preview" className="h-full w-full object-contain" />
                        ) : (
                          <ImageOff className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept={ACCEPTED_LOGO_TYPES.join(",")}
                          className="hidden"
                          onChange={handleLogoFileSelect}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingLogo}
                        >
                          {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                          {uploadingLogo ? "Uploading…" : "Upload Logo"}
                        </Button>
                        <p className="text-xs text-muted-foreground">PNG, JPG, WEBP or SVG · up to {MAX_LOGO_MB}MB.</p>
                        <p className="text-xs text-muted-foreground">
                          Shown on the login page, dashboard, sidebar, navbar, reports, PDFs, and emails.
                        </p>
                      </div>
                    </div>
                    {/* Fallback for teams that host their logo externally (CDN/S3) and just want to paste a URL. */}
                    <Input placeholder="Or paste an external logo URL…" className="mt-2" {...register("logo_url")} />
                  </div>
                  <div className="sm:col-span-2">
                    <Button type="submit" disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === "timing" && (
            <Card className="glass">
              <CardHeader><CardTitle>Office Timing</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label>Office Start Time</Label>
                    <Input type="time" {...register("office_start_time")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Office End Time</Label>
                    <Input type="time" {...register("office_end_time")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Late Grace Period (minutes)</Label>
                    <Input type="number" {...register("late_grace_minutes")} />
                  </div>
                  <div className="sm:col-span-3">
                    <Button type="submit" disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === "smtp" && (
            <Card className="glass">
              <CardHeader><CardTitle>SMTP Configuration</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>SMTP Host</Label>
                    <Input placeholder="smtp.gmail.com" {...register("smtp_host")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>SMTP Port</Label>
                    <Input type="number" placeholder="587" {...register("smtp_port")} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>SMTP Username</Label>
                    <Input {...register("smtp_user")} />
                  </div>
                  <p className="text-xs text-muted-foreground sm:col-span-2">
                    SMTP password is configured via environment variables on the server, not stored here, for security.
                  </p>
                  <div className="sm:col-span-2">
                    <Button type="submit" disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === "password" && (
            <Card className="glass">
              <CardHeader><CardTitle>Password Policy</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Minimum Password Length</Label>
                    <Input type="number" {...register("password_min_length")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Session Timeout (minutes)</Label>
                    <Input type="number" {...register("session_timeout_minutes")} />
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <input type="checkbox" className="h-4 w-4 rounded border-border" {...register("password_require_special_char")} />
                    <Label className="!mb-0">Require special character in password</Label>
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <input type="checkbox" className="h-4 w-4 rounded border-border" {...register("camera_verification_enabled")} />
                    <Label className="!mb-0">Require camera verification photo at attendance punch in/out</Label>
                  </div>
                  <p className="text-xs text-muted-foreground sm:col-span-2">
                    If enabled, employees are asked to capture a live photo when they punch in and punch out —
                    this is what confirms who physically attended, not app login. A denied or unavailable camera
                    never blocks the punch — it's simply flagged for Admin review.
                  </p>
                  <div className="sm:col-span-2">
                    <Button type="submit" disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === "password" && (
            <Card className="glass mt-6">
              <CardHeader>
                <CardTitle>Storage &amp; Cleanup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Temporary images — post-login camera verification snapshots and unapproved/rejected profile photo
                  requests — are automatically deleted after {" "}
                  <span className="font-medium text-foreground">2 days</span> by a daily background job. An
                  employee's currently approved profile photo is never affected, regardless of age.
                </p>
                <Button type="button" variant="outline" onClick={() => cleanupMutation.mutate()} disabled={cleanupMutation.isPending}>
                  {cleanupMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Run Cleanup Now
                </Button>
                {cleanupMutation.data && (
                  <p className="text-xs text-muted-foreground">
                    Checked {cleanupMutation.data.checked}, deleted {cleanupMutation.data.deleted}, protected{" "}
                    {cleanupMutation.data.skipped_protected}
                    {cleanupMutation.data.errors > 0 ? `, ${cleanupMutation.data.errors} error(s)` : ""}.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "password" && (
            <Card className="glass mt-6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-4 w-4" /> Database Health
                </CardTitle>
                <Button type="button" size="sm" variant="ghost" onClick={() => refetchAudit()} disabled={auditLoading}>
                  <RefreshCw className={cn("h-3.5 w-3.5", auditLoading && "animate-spin")} />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Read-only report — orphaned records (belonging to a deactivated employee), duplicate records the
                  schema doesn't enforce uniqueness on, and stale audit rows. Nothing here is deleted automatically;
                  review findings with an Admin/DBA first.
                </p>

                {auditLoading && !auditReport && (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Running audit…
                  </p>
                )}

                {auditReport && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">Orphaned Records</p>
                      <ul className="mt-1 space-y-0.5 text-sm">
                        {Object.entries(auditReport.orphaned_records)
                          .filter(([, v]) => v.count > 0)
                          .map(([key, v]) => (
                            <li key={key} className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                              <AlertTriangle className="h-3.5 w-3.5" /> {v.count} {key.replace(/_/g, " ")}
                            </li>
                          ))}
                        {Object.values(auditReport.orphaned_records).every((v) => v.count === 0) && (
                          <li className="text-muted-foreground">None found.</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">Duplicate Records</p>
                      <ul className="mt-1 space-y-0.5 text-sm">
                        {Object.entries(auditReport.duplicate_records)
                          .filter(([, v]) => v.duplicate_groups > 0)
                          .map(([key, v]) => (
                            <li key={key} className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                              <AlertTriangle className="h-3.5 w-3.5" /> {v.extra_rows} extra ({key.replace(/_/g, " ")})
                            </li>
                          ))}
                        {Object.values(auditReport.duplicate_records).every((v) => v.duplicate_groups === 0) && (
                          <li className="text-muted-foreground">None found.</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">Stale Records</p>
                      <ul className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                        <li>{auditReport.stale_records.email_logs_older_than_180_days} email logs &gt; 180 days</li>
                        <li>
                          {auditReport.stale_records.password_resets_expired_or_used_older_than_30_days} old password
                          reset tokens
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "holidays" && <HolidayCalendarPanel />}
        </motion.div>
      )}
    </div>
  );
}

function HolidayCalendarPanel() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [isOptional, setIsOptional] = useState(false);

  const { data: holidays, isLoading } = useQuery({
    queryKey: ["holidays"],
    queryFn: () => settingsService.listHolidays(),
  });

  const createMutation = useMutation({
    mutationFn: settingsService.createHoliday,
    onSuccess: () => {
      toast.success("Holiday added. All employees notified.");
      setName("");
      setDate("");
      setIsOptional(false);
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: settingsService.deleteHoliday,
    onSuccess: () => {
      toast.success("Holiday removed.");
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
    },
  });

  return (
    <div className="space-y-6">
      <Card className="glass">
        <CardHeader><CardTitle>Add Holiday</CardTitle></CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate({ name, date, is_optional: isOptional });
            }}
            className="flex flex-wrap items-end gap-3"
          >
            <div className="space-y-1.5">
              <Label className="text-xs">Holiday Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Independence Day" className="w-56" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 pb-2 text-sm">
              <input type="checkbox" checked={isOptional} onChange={(e) => setIsOptional(e.target.checked)} className="h-4 w-4 rounded border-border" />
              Optional
            </label>
            <Button type="submit" disabled={!name || !date || createMutation.isPending}>
              <Plus className="h-4 w-4" /> Add Holiday
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader><CardTitle>Holiday Calendar {holidays ? `(${holidays.length})` : ""}</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">Loading…</td></tr>}
              {holidays?.map((h) => (
                <tr key={h.id} className="border-b border-border/50 last:border-0">
                  <td className="px-6 py-3">{format(new Date(h.date), "MMM d, yyyy")}</td>
                  <td className="px-6 py-3 font-medium">{h.name}</td>
                  <td className="px-6 py-3 text-muted-foreground">{h.is_optional ? "Optional" : "Mandatory"}</td>
                  <td className="px-6 py-3">
                    <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(h.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
              {!isLoading && !holidays?.length && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">No holidays added yet.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
