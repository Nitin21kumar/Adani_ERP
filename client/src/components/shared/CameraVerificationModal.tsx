import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, ShieldCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadService } from "@/services/uploadService";
import { cn } from "@/utils/cn";

export type VerificationOutcome = {
  photo_url: string | null;
  status: "captured" | "denied" | "unavailable" | "error" | "skipped";
};

type UploadFolder = Parameters<typeof uploadService.upload>[1];

interface CameraVerificationModalProps {
  onComplete: (result: VerificationOutcome) => void;
  title?: string;
  subtitle?: string;
  uploadFolder?: UploadFolder;
  filenamePrefix?: string;
  skipHint?: string;
}

type Phase = "requesting" | "live" | "captured" | "denied" | "unavailable";

/**
 * Full-screen, non-dismissible-by-accident overlay shown right after a
 * successful login. Requests the camera, requires a live capture, and only
 * then hands control back via onComplete. Denial/unavailability/errors are
 * never blocking — the person can always continue via the "skip" path;
 * the backend is responsible for flagging that to Admins.
 */
export default function CameraVerificationModal({
  onComplete,
  title = "Identity Verification",
  subtitle = "Please capture a quick photo to verify it's really you signing in.",
  uploadFolder = "login_verification_photos",
  filenamePrefix = "login-verification",
  skipHint = "You can still sign in without this step — an Admin will simply be notified.",
}: CameraVerificationModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<Phase>("requesting");
  const [submitting, setSubmitting] = useState(false);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startCamera = async () => {
    setPhase("requesting");
    if (!navigator.mediaDevices?.getUserMedia) {
      setPhase("unavailable");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPhase("live");
    } catch {
      setPhase("denied");
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
          setPreviewUrl(URL.createObjectURL(blob));
          setPhase("captured");
          stopStream();
        }
      },
      "image/jpeg",
      0.9
    );
  };

  const handleRetake = () => {
    setCapturedBlob(null);
    setPreviewUrl(null);
    startCamera();
  };

  const handleConfirm = async () => {
    if (!capturedBlob) return;
    setSubmitting(true);
    try {
      const file = new File([capturedBlob], `${filenamePrefix}-${Date.now()}.jpg`, { type: "image/jpeg" });
      const url = await uploadService.upload(file, uploadFolder);
      onComplete({ photo_url: url, status: "captured" });
    } catch {
      onComplete({ photo_url: null, status: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    stopStream();
    const status: VerificationOutcome["status"] =
      phase === "denied" ? "denied" : phase === "unavailable" ? "unavailable" : "skipped";
    onComplete({ photo_url: null, status });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="glass w-full max-w-md rounded-xl border border-border p-6 text-center shadow-xl">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {subtitle}
        </p>

        <div className="relative mt-4 aspect-square w-full overflow-hidden rounded-lg bg-secondary">
          {phase === "captured" && previewUrl ? (
            <img src={previewUrl} alt="Captured verification" className="h-full w-full object-cover" />
          ) : (
            <video
              ref={videoRef}
              muted
              playsInline
              className={cn("h-full w-full object-cover", phase !== "live" && "hidden")}
            />
          )}
          {phase === "requesting" && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          {(phase === "denied" || phase === "unavailable") && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-muted-foreground">
              <ShieldAlert className="h-8 w-8" />
              <p className="text-sm">
                {phase === "denied"
                  ? "Camera access was denied."
                  : "No camera is available on this device."}
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {phase === "live" && (
            <Button className="w-full" onClick={handleCapture}>
              <Camera className="h-4 w-4" /> Capture Photo
            </Button>
          )}
          {phase === "captured" && (
            <>
              <Button className="w-full" onClick={handleConfirm} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Confirm & Continue
              </Button>
              <Button className="w-full" variant="outline" onClick={handleRetake} disabled={submitting}>
                Retake
              </Button>
            </>
          )}
          {(phase === "denied" || phase === "unavailable") && (
            <Button className="w-full" variant="outline" onClick={handleSkip}>
              Continue Without Verification
            </Button>
          )}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {skipHint}
        </p>
      </div>
    </div>
  );
}
