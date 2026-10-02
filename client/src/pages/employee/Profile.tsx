import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2, Send, Upload, FileText, Trash2, Mail, Phone, Briefcase, Calendar, Building2, Camera, Clock, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { profileService } from "@/services/profileService";
import { uploadService } from "@/services/uploadService";
import { profileChangeRequestService } from "@/services/profileChangeRequestService";
import type { ProfileChangeRequestCreate } from "@/types/profileChangeRequest";
import { resolveAssetUrl } from "@/utils/assetUrl";

const MAX_PHOTO_MB = 5;
const ACCEPTED_PHOTO_TYPES = ["image/png", "image/jpeg", "image/webp"];

interface ChangeFormValues {
  requested_phone: string;
  requested_address: string;
  requested_emergency_contact_name: string;
  requested_emergency_contact_phone: string;
}

export default function EmployeeProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docCategory, setDocCategory] = useState("other");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useQuery({ queryKey: ["profile", "me"], queryFn: profileService.me });
  const { data: documents } = useQuery({ queryKey: ["profile", "documents"], queryFn: profileService.documents });
  const { data: latestChangeRequest } = useQuery({
    queryKey: ["profile", "change-request", "me"],
    queryFn: profileChangeRequestService.myLatest,
  });

  // Photo changes are free — upload and save immediately, no approval needed.
  const updatePhotoMutation = useMutation({
    mutationFn: profileService.updatePhoto,
    onSuccess: () => {
      toast.success("Profile photo updated.");
      queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to update photo"),
  });

  const handlePhotoFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
      toast.error("Please upload a PNG, JPG, or WEBP image.");
      return;
    }
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      toast.error(`Photo must be smaller than ${MAX_PHOTO_MB}MB.`);
      return;
    }

    setUploadingPhoto(true);
    try {
      const url = await uploadService.upload(file, "profile_photo_requests");
      await updatePhotoMutation.mutateAsync(url);
    } catch (err: any) {
      if (!err?.response?.data?.detail) toast.error("Upload failed. Please try again.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const isChangePending = latestChangeRequest?.status === "pending";

  const { register, handleSubmit, reset } = useForm<ChangeFormValues>();

  useEffect(() => {
    if (profile) {
      reset({
        requested_phone: profile.phone || "",
        requested_address: profile.address || "",
        requested_emergency_contact_name: profile.emergency_contact_name || "",
        requested_emergency_contact_phone: profile.emergency_contact_phone || "",
      });
    }
  }, [profile, reset]);

  const submitChangeRequestMutation = useMutation({
    mutationFn: (payload: ProfileChangeRequestCreate) => profileChangeRequestService.submit(payload),
    onSuccess: () => {
      toast.success("Change request submitted. HR/Admin has been notified by email and will review it.");
      queryClient.invalidateQueries({ queryKey: ["profile", "change-request", "me"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to submit change request"),
  });

  const onSubmitChangeRequest = (values: ChangeFormValues) => {
    submitChangeRequestMutation.mutate({
      requested_phone: values.requested_phone || undefined,
      requested_address: values.requested_address || undefined,
      requested_emergency_contact_name: values.requested_emergency_contact_name || undefined,
      requested_emergency_contact_phone: values.requested_emergency_contact_phone || undefined,
    });
  };

  const addDocMutation = useMutation({
    mutationFn: profileService.addDocument,
    onSuccess: () => {
      toast.success("Document uploaded.");
      setDocFile(null);
      queryClient.invalidateQueries({ queryKey: ["profile", "documents"] });
    },
  });

  const removeDocMutation = useMutation({
    mutationFn: profileService.removeDocument,
    onSuccess: () => {
      toast.success("Document removed.");
      queryClient.invalidateQueries({ queryKey: ["profile", "documents"] });
    },
  });

  const handleDocUpload = async () => {
    if (!docFile) return;
    setUploadingDoc(true);
    try {
      const url = await uploadService.upload(docFile);
      await addDocMutation.mutateAsync({
        file_name: docFile.name,
        file_url: url,
        file_type: docFile.type,
        doc_category: docCategory,
      });
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploadingDoc(false);
    }
  };

  if (isLoading || !profile) {
    return <p className="text-muted-foreground">Loading profile…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-sm text-muted-foreground">You can change your photo anytime. Other details need HR/Admin approval.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass">
          <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-start">
            <div className="relative shrink-0">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                {resolveAssetUrl(profile.photo_url) ? (
                  <img src={resolveAssetUrl(profile.photo_url)!} alt={profile.full_name} className="h-full w-full object-cover" />
                ) : (
                  profile.full_name?.[0]?.toUpperCase() || "?"
                )}
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept={ACCEPTED_PHOTO_TYPES.join(",")}
                className="hidden"
                onChange={handlePhotoFileSelect}
              />
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={uploadingPhoto}
                title="Change your photo — no approval needed"
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-secondary text-foreground shadow-sm hover:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploadingPhoto ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
              </button>
            </div>
            <div className="flex-1 space-y-1 text-center sm:text-left">
              <h2 className="text-xl font-semibold">{profile.full_name}</h2>
              <p className="text-sm text-muted-foreground">{profile.designation || "—"} · {profile.employee_code}</p>
              <div className="mt-2 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground sm:justify-start">
                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {profile.email}</span>
                {profile.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {profile.phone}</span>}
                {profile.department && <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {profile.department.name}</span>}
                {profile.joining_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Joined {format(new Date(profile.joining_date), "MMM d, yyyy")}
                  </span>
                )}
              </div>
              {profile.manager && (
                <p className="flex items-center justify-center gap-1 text-sm text-muted-foreground sm:justify-start">
                  <Briefcase className="h-3.5 w-3.5" /> Reports to {profile.manager.full_name}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Click the camera icon to change your photo — it updates immediately, no approval needed.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Personal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            You can't change these directly — fill in the details you want and submit for HR/Admin review. They'll
            be applied only once approved, and HR is notified by email as soon as you submit.
          </p>

          {isChangePending && (
            <div className="flex items-center gap-1.5 rounded-md bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-600 dark:text-amber-400">
              <Clock className="h-3.5 w-3.5" /> You have a change request pending HR/Admin approval.
            </div>
          )}
          {!isChangePending && latestChangeRequest?.status === "approved" && (
            <div className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Your last change request was approved.
            </div>
          )}
          {!isChangePending && latestChangeRequest?.status === "rejected" && (
            <div className="flex items-center gap-1.5 rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
              <XCircle className="h-3.5 w-3.5" />
              Last change request rejected{latestChangeRequest.review_comment ? `: ${latestChangeRequest.review_comment}` : ""}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmitChangeRequest)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input disabled={isChangePending} {...register("requested_phone")} />
            </div>
            <div className="space-y-1.5">
              <Label>Emergency Contact Name</Label>
              <Input disabled={isChangePending} {...register("requested_emergency_contact_name")} />
            </div>
            <div className="space-y-1.5">
              <Label>Emergency Contact Phone</Label>
              <Input disabled={isChangePending} {...register("requested_emergency_contact_phone")} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Address</Label>
              <textarea
                className="flex min-h-[70px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
                disabled={isChangePending}
                {...register("requested_address")}
              />
            </div>
            <p className="text-xs text-muted-foreground sm:col-span-2">
              Department, designation, and role can only be changed by an admin.
            </p>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={submitChangeRequestMutation.isPending || isChangePending}>
                {submitChangeRequestMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {isChangePending ? "Request Pending Review" : "Request Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <select
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                value={docCategory}
                onChange={(e) => setDocCategory(e.target.value)}
              >
                <option value="id_proof">ID Proof</option>
                <option value="certificate">Certificate</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">File</Label>
              <input
                type="file"
                className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm"
                onChange={(e) => setDocFile(e.target.files?.[0] || null)}
              />
            </div>
            <Button onClick={handleDocUpload} disabled={!docFile || uploadingDoc}>
              {uploadingDoc ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload
            </Button>
          </div>

          <div className="divide-y divide-border/60 rounded-md border border-border">
            {documents?.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <a href={doc.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm hover:underline">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  {doc.file_name}
                  <span className="text-xs capitalize text-muted-foreground">({doc.doc_category?.replace("_", " ")})</span>
                </a>
                <Button size="icon" variant="ghost" onClick={() => removeDocMutation.mutate(doc.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))}
            {!documents?.length && <p className="px-4 py-6 text-center text-sm text-muted-foreground">No documents uploaded yet.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
