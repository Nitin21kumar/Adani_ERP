import { useRef, useState } from "react";
import { Camera, ImagePlus, Trash2, Loader2, ImageOff, MapPin } from "lucide-react";
import { toast } from "sonner";
import { resolveAssetUrl } from "@/utils/assetUrl";
import { useGeolocation } from "@/hooks/useGeolocation";
import { cn } from "@/utils/cn";
import type { PhotoLocation, VerificationImageDetail } from "@/types/audit";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const MAX_VERIFICATION_IMAGES = 10;

interface ImageUploaderProps {
  images: string[];
  imageDetails?: VerificationImageDetail[];
  onUpload: (files: File[], location?: PhotoLocation) => Promise<void>;
  onDelete: (imageUrl: string) => Promise<void>;
  disabled?: boolean;
  disabledHint?: string;
}

/**
 * Multi-image capture/upload widget for the auditor verification form.
 * Two separate triggers rather than one combined input: mobile browsers
 * handle `capture` + `multiple` on the same <input> inconsistently (some
 * force straight into the camera app and silently drop multi-select, making
 * it look like "the camera doesn't work") — so "Take Photo" (capture,
 * single-shot) and "Choose from Gallery" (multi-select, no capture) are
 * separate inputs/buttons instead of one.
 *
 * "Take Photo" also captures the device's current location (best-effort —
 * a denied/unavailable permission never blocks the photo, it's just
 * omitted, same graceful-degradation pattern as the Employee ERP's login
 * location capture). Gallery picks never request location, since those
 * photos may not have been taken at the current site.
 */
export default function ImageUploader({ images, imageDetails, onUpload, onDelete, disabled, disabledHint }: ImageUploaderProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const pendingLocationRef = useRef<Promise<PhotoLocation | null> | null>(null);
  const { request: requestLocation } = useGeolocation();
  const [uploading, setUploading] = useState(false);
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);

  const remainingSlots = MAX_VERIFICATION_IMAGES - images.length;
  const locationByUrl = new Map((imageDetails || []).filter((d) => d.location).map((d) => [d.imageUrl, d.location!]));

  const handleFiles = async (fileList: FileList | null, inputEl: HTMLInputElement | null, location?: PhotoLocation) => {
    if (!fileList?.length) return;
    const files = Array.from(fileList);

    if (files.length > remainingSlots) {
      toast.error(`You can add up to ${MAX_VERIFICATION_IMAGES} photos per verification (${remainingSlots} remaining).`);
      if (inputEl) inputEl.value = "";
      return;
    }
    const invalid = files.find((f) => !ALLOWED_TYPES.includes(f.type));
    if (invalid) {
      toast.error(`"${invalid.name}" is not a supported image type (use JPEG, PNG, WEBP, or GIF).`);
      if (inputEl) inputEl.value = "";
      return;
    }
    const oversized = files.find((f) => f.size > MAX_FILE_SIZE);
    if (oversized) {
      toast.error(`"${oversized.name}" is larger than 5MB.`);
      if (inputEl) inputEl.value = "";
      return;
    }

    setUploading(true);
    try {
      await onUpload(files, location);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to upload photo(s)");
    } finally {
      setUploading(false);
      if (inputEl) inputEl.value = "";
    }
  };

  const handleCameraClick = () => {
    // Fire the location request in parallel with opening the camera app —
    // by the time the user has framed and taken the shot, this has almost
    // always resolved, so the upload isn't delayed waiting on it.
    pendingLocationRef.current = requestLocation();
    cameraInputRef.current?.click();
  };

  const handleCameraChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const inputEl = e.target;
    const location = (await pendingLocationRef.current) ?? undefined;
    await handleFiles(files, inputEl, location);
  };

  const handleDelete = async (url: string) => {
    setDeletingUrl(url);
    try {
      await onDelete(url);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to delete photo");
    } finally {
      setDeletingUrl(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {images.map((url) => {
          const location = locationByUrl.get(url);
          return (
            <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-secondary">
              <img src={resolveAssetUrl(url) ?? undefined} alt="Asset evidence" className="h-full w-full object-cover" />
              {location && (
                <a
                  href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-medium text-white hover:bg-black/80"
                  title="View capture location"
                >
                  <MapPin className="h-3 w-3" /> Location
                </a>
              )}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleDelete(url)}
                  disabled={deletingUrl === url}
                  className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-100"
                  aria-label="Delete photo"
                >
                  {deletingUrl === url ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {!disabled && remainingSlots > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleCameraClick}
            disabled={uploading}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-3 text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary",
              uploading && "pointer-events-none opacity-60"
            )}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            Take Photo
          </button>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-3 text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary",
              uploading && "pointer-events-none opacity-60"
            )}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            Choose from Gallery
          </button>
        </div>
      )}

      {!images.length && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ImageOff className="h-3.5 w-3.5" /> No photos added yet — at least one is required before submitting to MIS.
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        {images.length}/{MAX_VERIFICATION_IMAGES} photos · JPEG, PNG, WEBP, or GIF · up to 5MB each · location is captured with "Take Photo" when available
        {disabled && disabledHint ? ` · ${disabledHint}` : ""}
      </p>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files, e.target)}
      />
    </div>
  );
}
