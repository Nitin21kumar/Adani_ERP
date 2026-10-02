export type AuditRole = "audit_admin" | "auditor" | "mis_verifier";

export interface AuditUser {
  id: string;
  name: string;
  email: string;
  role: AuditRole;
  status: "active" | "inactive";
  createdAt?: string;
}

export interface AuditLoginPayload {
  email: string;
  password: string;
}

export interface AuditTokenResponse {
  access_token: string;
  token_type: string;
  user: AuditUser;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  limit: number;
  skip: number;
}

export interface AuditProduct {
  id: string;
  productName: string;
  category: string;
  subCategory?: string;
  allowCustomSubProduct: boolean;
  defaultBaseCost: number;
  active: boolean;
}

export interface DamageCriteria {
  id: string;
  name: string;
  category?: string;
  active: boolean;
}

export interface ConditionRating {
  id: string;
  name: string;
  valuationPercentage: number;
  active: boolean;
}

export type AuditTaskStatus = "assigned" | "in_progress" | "completed";

export interface AuditTask {
  id: string;
  taskCode: string;
  title?: string;
  auditor: { id: string; name: string; email: string };
  createdBy: { id: string; name: string; email: string };
  status: AuditTaskStatus;
  assignedAt: string;
  notes?: string;
  createdAt: string;
}

export type VerificationStatus = "draft" | "submitted_to_mis" | "returned_for_correction" | "mis_approved" | "closed";

export interface PhotoLocation {
  latitude: number;
  longitude: number;
}

export interface VerificationImageDetail {
  id: string;
  imageUrl: string;
  uploadedAt: string;
  location?: PhotoLocation;
}

export interface AssetVerification {
  id: string;
  auditTask: { id: string; taskCode: string; title?: string; status: AuditTaskStatus };
  auditor: { id: string; name: string; email: string };
  product?: { id: string; productName: string; category: string; subCategory?: string; allowCustomSubProduct: boolean };
  isOtherProduct: boolean;
  productName: string;
  customSubProductName?: string;
  selectedDamageCriteria: DamageCriteria[];
  conditionRating?: ConditionRating;
  baseCost: number;
  tentativeCost: number;
  actualCost?: number;
  remarks?: string;
  images: string[];
  imageDetails?: VerificationImageDetail[];
  status: VerificationStatus;
  auditorSubmittedAt?: string;
  misVerifiedAt?: string;
  misVerifier?: { id: string; name: string; email: string };
  misRemarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  total_tasks: number;
  completed_tasks: number;
  pending_verifications: number;
  mis_approved_verifications: number;
  condition_wise_count: Record<string, number>;
  total_tentative_valuation: number;
  total_actual_valuation: number;
  damaged_assets_count: number;
  non_functional_count: number;
  missing_count: number;
}

export interface AuditNotification {
  id: string;
  role: AuditRole;
  type: string;
  title: string;
  message: string;
  verification?: { id: string; productName: string; status: VerificationStatus };
  read: boolean;
  createdAt: string;
}
