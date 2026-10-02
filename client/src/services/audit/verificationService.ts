import { auditApi } from "./api";
import { downloadBlob, filenameFromDisposition } from "@/utils/download";
import type { AssetVerification, Paginated, PhotoLocation } from "@/types/audit";

export interface VerificationFormPayload {
  auditTaskId?: string;
  productId?: string;
  // Set when the product isn't in Product Master yet — productName is a
  // free-text entry instead of a productId, and MIS gets notified on submit.
  isOtherProduct?: boolean;
  productName?: string;
  customSubProductName?: string;
  selectedDamageCriteria?: string[];
  conditionRatingId?: string;
  baseCost?: number;
  remarks?: string;
}

export const auditVerificationService = {
  create: (payload: VerificationFormPayload) => auditApi.post<AssetVerification>("/verifications", payload).then((r) => r.data),
  update: (id: string, payload: VerificationFormPayload) => auditApi.patch<AssetVerification>(`/verifications/${id}`, payload).then((r) => r.data),
  get: (id: string) => auditApi.get<AssetVerification>(`/verifications/${id}`).then((r) => r.data),
  submit: (id: string) => auditApi.post<AssetVerification>(`/verifications/${id}/submit`).then((r) => r.data),

  uploadImages: (id: string, files: File[], location?: PhotoLocation) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    if (location) {
      formData.append("latitude", String(location.latitude));
      formData.append("longitude", String(location.longitude));
    }
    return auditApi.post<AssetVerification>(`/verifications/${id}/images`, formData, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
  },
  deleteImage: (id: string, imageUrl: string) => auditApi.delete<AssetVerification>(`/verifications/${id}/images`, { data: { imageUrl } }).then((r) => r.data),

  myVerifications: (params: { status?: string; auditTask?: string; search?: string; limit?: number; skip?: number } = {}) =>
    auditApi.get<Paginated<AssetVerification>>("/my-verifications", { params }).then((r) => r.data),

  list: (params: { status?: string; auditor?: string; auditTask?: string; search?: string; limit?: number; skip?: number } = {}) =>
    auditApi.get<Paginated<AssetVerification>>("/verifications", { params }).then((r) => r.data),

  exportApprovedCsv: async () => {
    const response = await auditApi.get("/verifications/export", { responseType: "blob" });
    const filename = filenameFromDisposition(response.headers["content-disposition"], "mis_approved_verifications.csv");
    downloadBlob(response.data, filename);
  },
};
