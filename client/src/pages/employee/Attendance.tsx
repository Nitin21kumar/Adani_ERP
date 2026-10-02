import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { LogIn, LogOut, MapPin, Clock, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CameraVerificationModal, { type VerificationOutcome } from "@/components/shared/CameraVerificationModal";
import { useGeolocation } from "@/hooks/useGeolocation";
import { attendanceService } from "@/services/attendanceService";
import { settingsService } from "@/services/settingsService";
import { detectDeviceInfo, reverseGeocode } from "@/utils/deviceInfo";

interface PendingLocation {
  latitude: number;
  longitude: number;
  full_address: string | null;
}

const NO_VERIFICATION: VerificationOutcome = { photo_url: null, status: "skipped" };

export default function EmployeeAttendance() {
  const queryClient = useQueryClient();
  const { request: requestLocation } = useGeolocation();
  const [processing, setProcessing] = useState<"login" | "logout" | null>(null);

  // Company Settings > "Require camera verification photo at attendance
  // punch in/out" governs whether the camera step below is shown at all.
  const { data: branding } = useQuery({
    queryKey: ["company-branding-public"],
    queryFn: settingsService.getPublic,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  const cameraRequired = !!branding?.camera_verification_enabled;

  // Which camera step (if any) is currently being shown.
  const [cameraStep, setCameraStep] = useState<"login" | "logout" | null>(null);
  const [pendingLocation, setPendingLocation] = useState<PendingLocation | null>(null);

  // Punch-out also collects "what did you work on today" right alongside
  // the identity photo — the work-done step opens after the camera step.
  const [workDoneOpen, setWorkDoneOpen] = useState(false);
  const [pendingLogoutVerification, setPendingLogoutVerification] = useState<VerificationOutcome | null>(null);
  const [taskDescription, setTaskDescription] = useState("");
  const [taskError, setTaskError] = useState<string | null>(null);

  const { data: today, isLoading } = useQuery({
    queryKey: ["attendance", "today"],
    queryFn: attendanceService.today,
  });

  const { data: history } = useQuery({
    queryKey: ["attendance", "history"],
    queryFn: () => attendanceService.myHistory(30),
  });

  const resetPunchState = () => {
    setCameraStep(null);
    setPendingLocation(null);
    setWorkDoneOpen(false);
    setPendingLogoutVerification(null);
    setTaskDescription("");
    setTaskError(null);
    setProcessing(null);
  };

  // ---- Punch In: capture location, then require an identity photo ----
  const handlePunchInClick = async () => {
    setProcessing("login");
    try {
      const coords = await requestLocation();
      if (!coords) {
        toast.error("Location access is required to mark attendance.");
        setProcessing(null);
        return;
      }
      const address = await reverseGeocode(coords.latitude, coords.longitude);
      setPendingLocation({ latitude: coords.latitude, longitude: coords.longitude, full_address: address });
      setProcessing(null);
      if (cameraRequired) {
        setCameraStep("login");
      } else {
        await handleLoginVerificationComplete(NO_VERIFICATION, {
          latitude: coords.latitude,
          longitude: coords.longitude,
          full_address: address,
        });
      }
    } catch {
      toast.error("Failed to get your location.");
      setProcessing(null);
    }
  };

  const handleLoginVerificationComplete = async (result: VerificationOutcome, locationOverride?: PendingLocation) => {
    setCameraStep(null);
    const location = locationOverride ?? pendingLocation;
    if (!location) return;
    setProcessing("login");
    try {
      const { browser, os, device } = detectDeviceInfo();
      await attendanceService.login({
        ...location,
        browser,
        os,
        device,
        verification_photo_url: result.photo_url,
        verification_photo_status: result.status,
      });
      toast.success("Punched in successfully. Have a great day!");
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to punch in");
    } finally {
      resetPunchState();
    }
  };

  // ---- Punch Out: capture location, then identity photo, then work-done description ----
  const handlePunchOutClick = async () => {
    setProcessing("logout");
    try {
      const coords = await requestLocation();
      if (!coords) {
        toast.error("Location access is required to mark attendance.");
        setProcessing(null);
        return;
      }
      const address = await reverseGeocode(coords.latitude, coords.longitude);
      setPendingLocation({ latitude: coords.latitude, longitude: coords.longitude, full_address: address });
      setProcessing(null);
      if (cameraRequired) {
        setCameraStep("logout");
      } else {
        handleLogoutVerificationComplete(NO_VERIFICATION);
      }
    } catch {
      toast.error("Failed to get your location.");
      setProcessing(null);
    }
  };

  const handleLogoutVerificationComplete = (result: VerificationOutcome) => {
    setCameraStep(null);
    setPendingLogoutVerification(result);
    setTaskDescription("");
    setWorkDoneOpen(true);
  };

  const handleFinalizeLogout = async () => {
    if (taskDescription.trim().length < 5) {
      setTaskError("Please describe what you worked on today (at least a few words).");
      return;
    }
    if (!pendingLocation || !pendingLogoutVerification) return;
    setProcessing("logout");
    try {
      await attendanceService.logout({
        ...pendingLocation,
        verification_photo_url: pendingLogoutVerification.photo_url,
        verification_photo_status: pendingLogoutVerification.status,
        task_description: taskDescription.trim(),
      });
      toast.success("Punched out. Working hours recorded.");
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["daily-report"] });
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to punch out");
    } finally {
      resetPunchState();
    }
  };

  const hasLoggedIn = !!today?.login_time;
  const hasLoggedOut = !!today?.logout_time;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Attendance</h1>
        <p className="text-sm text-muted-foreground">
          Mark your Punch In/Punch Out — location and identity photo are captured automatically.
        </p>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass">
          <CardContent className="flex flex-col items-center gap-6 p-8 sm:flex-row sm:justify-between">
            <div className="space-y-1 text-center sm:text-left">
              <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-emerald-500" /> Punch In:{" "}
                  {today?.login_time ? format(new Date(today.login_time), "hh:mm a") : "--:--"}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-amber-500" /> Punch Out:{" "}
                  {today?.logout_time ? format(new Date(today.logout_time), "hh:mm a") : "--:--"}
                </span>
                {today?.working_hours != null && (
                  <span className="font-medium">{today.working_hours.toFixed(2)}h worked</span>
                )}
              </div>
              {today?.is_late && (
                <span className="inline-block rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600">
                  Late Entry
                </span>
              )}
            </div>

            <div className="flex gap-3">
              <Button size="lg" onClick={handlePunchInClick} disabled={isLoading || hasLoggedIn || processing !== null}>
                {processing === "login" ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                Punch In
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handlePunchOutClick}
                disabled={isLoading || !hasLoggedIn || hasLoggedOut || processing !== null}
              >
                {processing === "logout" ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                Punch Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Recent Attendance</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Punch In</th>
                <th className="px-6 py-3 font-medium">Punch Out</th>
                <th className="px-6 py-3 font-medium">Hours</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Location</th>
              </tr>
            </thead>
            <tbody>
              {history?.map((row) => (
                <tr key={row.id} className="border-b border-border/50 last:border-0">
                  <td className="px-6 py-3">{format(new Date(row.date), "MMM d, yyyy")}</td>
                  <td className="px-6 py-3">{row.login_time ? format(new Date(row.login_time), "hh:mm a") : "--"}</td>
                  <td className="px-6 py-3">{row.logout_time ? format(new Date(row.logout_time), "hh:mm a") : "--"}</td>
                  <td className="px-6 py-3">{row.working_hours ?? "--"}</td>
                  <td className="px-6 py-3">
                    <span
                      className={
                        row.status === "late"
                          ? "rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600"
                          : "rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600"
                      }
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="max-w-xs truncate px-6 py-3 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {row.locations?.[0]?.full_address || "—"}
                    </span>
                  </td>
                </tr>
              ))}
              {!history?.length && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No attendance records yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* ---- Punch In: identity photo ---- */}
      {cameraStep === "login" && (
        <CameraVerificationModal
          onComplete={handleLoginVerificationComplete}
          title="Verify It's You — Punch In"
          subtitle="Capture a quick photo to confirm your identity before punching in."
          uploadFolder="attendance_verification_photos"
          filenamePrefix="punch-in-verification"
          skipHint="You can still punch in without this step — an Admin will simply be notified."
        />
      )}

      {/* ---- Punch Out: identity photo ---- */}
      {cameraStep === "logout" && (
        <CameraVerificationModal
          onComplete={handleLogoutVerificationComplete}
          title="Verify It's You — Punch Out"
          subtitle="Capture a quick photo to confirm your identity before punching out."
          uploadFolder="attendance_verification_photos"
          filenamePrefix="punch-out-verification"
          skipHint="You can still punch out without this step — an Admin will simply be notified."
        />
      )}

      {/* ---- Punch Out: work done today ---- */}
      <Dialog open={workDoneOpen} onOpenChange={(open) => !open && resetPunchState()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> What did you work on today?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Description</Label>
              <textarea
                className="flex min-h-[110px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="Briefly describe what you accomplished today"
                value={taskDescription}
                onChange={(e) => {
                  setTaskDescription(e.target.value);
                  if (taskError) setTaskError(null);
                }}
              />
              {taskError && <p className="text-xs text-destructive">{taskError}</p>}
            </div>
            <Button className="w-full" onClick={handleFinalizeLogout} disabled={processing === "logout"}>
              {processing === "logout" ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              Confirm Punch Out
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
