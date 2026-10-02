import { auditApi } from "./api";
import type { AuditProduct, Paginated } from "@/types/audit";

export interface CreateProductPayload {
  productName: string;
  category: string;
  subCategory?: string;
  allowCustomSubProduct?: boolean;
  defaultBaseCost: number;
  active?: boolean;
}

export const auditProductService = {
  list: (params: { search?: string; category?: string; active?: boolean; limit?: number; skip?: number } = {}) =>
    auditApi.get<Paginated<AuditProduct>>("/products", { params }).then((r) => r.data),
  create: (payload: CreateProductPayload) => auditApi.post<AuditProduct>("/products", payload).then((r) => r.data),
  update: (id: string, payload: Partial<Omit<AuditProduct, "id">>) =>
    auditApi.patch<AuditProduct>(`/products/${id}`, payload).then((r) => r.data),
};
