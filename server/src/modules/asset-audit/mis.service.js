import AssetVerification from "./asset-verification.model.js";
import { ApiError } from "../../core/utils/ApiError.js";
import { paging } from "../../core/utils/query.js";
import { getVerification } from "./verification.service.js";

export async function pendingVerifications(query) {
  const filter = { status: "submitted_to_mis" };
  if (query.search) filter.productName = new RegExp(query.search, "i");
  const { limit, skip } = paging(query);
  const [items, total] = await Promise.all([
    AssetVerification.find(filter)
      .populate("auditTask", "taskCode title")
      .populate("auditor", "name email")
      .populate("product", "productName category")
      .populate("conditionRating", "name valuationPercentage")
      .sort({ auditorSubmittedAt: 1 })
      .skip(skip).limit(limit),
    AssetVerification.countDocuments(filter)
  ]);
  return { items, total, limit, skip };
}

export async function approveVerification(id, misUser, body) {
  const verification = await AssetVerification.findById(id);
  if (!verification) throw new ApiError(404, "Verification not found");
  if (verification.status !== "submitted_to_mis") throw new ApiError(409, "Only verifications submitted to MIS can be approved");
  if (!verification.images.length) throw new ApiError(400, "Cannot approve a verification without at least one image");

  const actualCost = body.actualCost !== undefined && body.actualCost !== null && body.actualCost !== "" ? Number(body.actualCost) : verification.tentativeCost;
  if (!(actualCost >= 0)) throw new ApiError(400, "Actual cost must be a valid positive number");

  verification.actualCost = actualCost;
  verification.status = "mis_approved";
  verification.misVerifiedAt = new Date();
  verification.misVerifier = misUser.id;
  if (body.misRemarks !== undefined) verification.misRemarks = body.misRemarks;
  await verification.save();
  return getVerification(id, misUser);
}

export async function returnVerification(id, misUser, body) {
  if (!body.misRemarks?.trim()) throw new ApiError(400, "MIS remarks are required when returning a verification for correction");
  const verification = await AssetVerification.findById(id);
  if (!verification) throw new ApiError(404, "Verification not found");
  if (verification.status !== "submitted_to_mis") throw new ApiError(409, "Only verifications submitted to MIS can be returned");

  verification.status = "returned_for_correction";
  verification.misVerifiedAt = new Date();
  verification.misVerifier = misUser.id;
  verification.misRemarks = body.misRemarks;
  await verification.save();
  return getVerification(id, misUser);
}
