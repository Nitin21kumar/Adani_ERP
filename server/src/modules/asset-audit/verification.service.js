import AssetVerification from "./asset-verification.model.js";
import VerificationImage from "./verification-image.model.js";
import AuditTask from "./audit-task.model.js";
import Product from "./product-master.model.js";
import DamageCriteria from "./damage-criteria.model.js";
import ConditionRating from "./condition-rating.model.js";
import { ApiError } from "../../core/utils/ApiError.js";
import { paging } from "../../core/utils/query.js";
import { MAX_IMAGES_PER_VERIFICATION } from "./audit-upload.middleware.js";
import { notifyNewProductReported } from "./audit-notification.service.js";

const EDITABLE_STATUSES = ["draft", "returned_for_correction"];
const REMARKS_MANDATORY_RATINGS = ["Poor", "Non-functional", "Obsolete / Missing"];

const view = (query) => query
  .populate("auditTask", "taskCode title status")
  .populate("auditor", "name email")
  .populate("product", "productName category subCategory allowCustomSubProduct")
  .populate("selectedDamageCriteria", "name category")
  .populate("conditionRating", "name valuationPercentage")
  .populate("misVerifier", "name email")
  .populate("imageDetails", "imageUrl uploadedAt location");

async function validateDamageCriteriaIds(ids = []) {
  const unique = [...new Set(ids)];
  if (!unique.length) return [];
  const count = await DamageCriteria.countDocuments({ _id: { $in: unique } });
  if (count !== unique.length) throw new ApiError(400, "One or more damage criteria are invalid");
  return unique;
}

/** Recomputes tentativeCost from the current baseCost + conditionRating, and returns the rating doc (or null) for remarks-requirement checks. */
async function recompute(doc) {
  if (!doc.conditionRating) { doc.tentativeCost = 0; return null; }
  const rating = await ConditionRating.findById(doc.conditionRating);
  if (!rating) throw new ApiError(400, "Select a valid condition rating");
  doc.tentativeCost = Math.round(doc.baseCost * rating.valuationPercentage) / 100;
  return rating;
}

async function assertOwnedAndEditable(verification, auditor) {
  if (verification.auditor.toString() !== auditor.id) throw new ApiError(403, "You can only manage your own verifications");
  if (!EDITABLE_STATUSES.includes(verification.status)) throw new ApiError(409, "This verification can no longer be edited");
  // A task can hold several asset verifications (one auditor auditing many
  // assets at one location) — once the auditor marks the whole task
  // complete, every verification under it locks, even ones still in draft.
  const task = await AuditTask.findById(verification.auditTask).select("status");
  if (task?.status === "completed") throw new ApiError(409, "This task has been marked complete and can no longer be edited");
}

export async function createVerification(auditor, body) {
  const task = await AuditTask.findOne({ _id: body.auditTaskId, auditor: auditor.id });
  if (!task) throw new ApiError(404, "Audit task not found or not assigned to you");
  if (task.status === "completed") throw new ApiError(409, "This task has already been completed");

  const isOtherProduct = !!body.isOtherProduct;
  let product = null;
  let productName;
  let baseCost;

  if (isOtherProduct) {
    // Product isn't in Product Master yet — let the auditor proceed with a
    // free-text name instead of blocking the verification on it. MIS is
    // notified on submit so they can add it (see submitVerification below).
    productName = body.productName?.trim();
    if (!productName) throw new ApiError(400, "Enter a product name");
    baseCost = body.baseCost !== undefined ? Number(body.baseCost) : NaN;
    if (!(baseCost > 0)) throw new ApiError(400, "Base cost must be a valid positive number");
  } else {
    product = await Product.findOne({ _id: body.productId, active: true });
    if (!product) throw new ApiError(400, "Select a valid product");
    productName = product.productName;
    baseCost = body.baseCost !== undefined ? Number(body.baseCost) : product.defaultBaseCost;
    if (!(baseCost > 0)) throw new ApiError(400, "Base cost must be a valid positive number");
  }

  const selectedDamageCriteria = await validateDamageCriteriaIds(body.selectedDamageCriteria);

  const doc = new AssetVerification({
    auditTask: task.id,
    auditor: auditor.id,
    product: product?.id,
    isOtherProduct,
    productName,
    customSubProductName: !isOtherProduct && product.allowCustomSubProduct ? body.customSubProductName : undefined,
    selectedDamageCriteria,
    baseCost,
    remarks: body.remarks,
    status: "draft"
  });
  if (body.conditionRatingId) doc.conditionRating = body.conditionRatingId;
  await recompute(doc);
  await doc.save();

  if (task.status === "assigned") { task.status = "in_progress"; await task.save(); }
  return view(AssetVerification.findById(doc.id));
}

export async function updateVerification(id, auditor, body) {
  const verification = await AssetVerification.findById(id);
  if (!verification) throw new ApiError(404, "Verification not found");
  await assertOwnedAndEditable(verification, auditor);

  if (body.isOtherProduct !== undefined) verification.isOtherProduct = !!body.isOtherProduct;

  if (verification.isOtherProduct) {
    if (body.productName !== undefined) {
      const productName = body.productName?.trim();
      if (!productName) throw new ApiError(400, "Enter a product name");
      verification.productName = productName;
    }
    verification.product = undefined;
    verification.customSubProductName = undefined;
  } else if (body.productId) {
    const product = await Product.findOne({ _id: body.productId, active: true });
    if (!product) throw new ApiError(400, "Select a valid product");
    verification.product = product.id;
    verification.productName = product.productName;
    if (!product.allowCustomSubProduct) verification.customSubProductName = undefined;
    if (body.customSubProductName !== undefined) verification.customSubProductName = body.customSubProductName;
  } else if (body.customSubProductName !== undefined) {
    verification.customSubProductName = body.customSubProductName;
  }

  if (body.selectedDamageCriteria !== undefined) verification.selectedDamageCriteria = await validateDamageCriteriaIds(body.selectedDamageCriteria);
  if (body.remarks !== undefined) verification.remarks = body.remarks;
  if (body.baseCost !== undefined) {
    const baseCost = Number(body.baseCost);
    if (!(baseCost > 0)) throw new ApiError(400, "Base cost must be a valid positive number");
    verification.baseCost = baseCost;
  }
  if (body.conditionRatingId !== undefined) verification.conditionRating = body.conditionRatingId || undefined;

  await recompute(verification);
  await verification.save();
  return view(AssetVerification.findById(verification.id));
}

export async function submitVerification(id, auditor) {
  const verification = await AssetVerification.findById(id).populate("conditionRating", "name");
  if (!verification) throw new ApiError(404, "Verification not found");
  await assertOwnedAndEditable(verification, auditor);

  if (!verification.product && !verification.isOtherProduct) throw new ApiError(400, "Product is mandatory");
  if (verification.isOtherProduct && !verification.productName?.trim()) throw new ApiError(400, "Enter a product name");
  if (!verification.conditionRating) throw new ApiError(400, "Condition rating is mandatory");
  if (!(verification.baseCost > 0)) throw new ApiError(400, "Base cost must be a valid positive number");
  if (!verification.images.length) throw new ApiError(400, "At least one photo is required before submitting to MIS");

  const remarksRequired = REMARKS_MANDATORY_RATINGS.includes(verification.conditionRating.name) || verification.selectedDamageCriteria.length > 0;
  if (remarksRequired && !verification.remarks?.trim()) throw new ApiError(400, "Remarks are required for this condition rating or when damage criteria are selected");

  verification.status = "submitted_to_mis";
  verification.auditorSubmittedAt = new Date();
  await verification.save();
  if (verification.isOtherProduct) {
    // Best-effort — a notification hiccup should never block the auditor's submission.
    await notifyNewProductReported(verification, auditor).catch(() => {});
  }
  return view(AssetVerification.findById(verification.id));
}

export async function addImages(id, auditor, files, location) {
  const verification = await AssetVerification.findById(id);
  if (!verification) throw new ApiError(404, "Verification not found");
  await assertOwnedAndEditable(verification, auditor);
  if (!files?.length) throw new ApiError(400, "Select at least one image");
  if (verification.images.length + files.length > MAX_IMAGES_PER_VERIFICATION) {
    throw new ApiError(400, `You can upload up to ${MAX_IMAGES_PER_VERIFICATION} photos per verification`);
  }

  const urls = files.map((file) => `/uploads/asset-audit/${file.filename}`);
  await VerificationImage.insertMany(urls.map((imageUrl) => ({ verification: verification.id, imageUrl, ...(location && { location }) })));
  verification.images.push(...urls);
  await verification.save();
  return view(AssetVerification.findById(verification.id));
}

export async function deleteImage(id, imageUrl, auditor) {
  const verification = await AssetVerification.findById(id);
  if (!verification) throw new ApiError(404, "Verification not found");
  await assertOwnedAndEditable(verification, auditor);
  if (!imageUrl) throw new ApiError(400, "imageUrl is required");

  const image = await VerificationImage.findOne({ verification: verification.id, imageUrl });
  if (!image) throw new ApiError(404, "Image not found");
  verification.images = verification.images.filter((url) => url !== imageUrl);
  await verification.save();
  await image.deleteOne();
  return view(AssetVerification.findById(verification.id));
}

export async function getVerification(id, auditUser) {
  const verification = await view(AssetVerification.findById(id));
  if (!verification) throw new ApiError(404, "Verification not found");
  if (auditUser.role === "auditor" && verification.auditor.id !== auditUser.id) throw new ApiError(403, "You can only view your own verifications");
  return verification;
}

export async function myVerifications(auditor, query) {
  const filter = { auditor: auditor.id };
  if (query.status) filter.status = query.status;
  // Scope to a single task — a task represents one location/site visit that
  // can cover many assets, so an auditor needs to see every verification
  // already logged under that task (not just the most recent one).
  if (query.auditTask) filter.auditTask = query.auditTask;
  if (query.search) filter.productName = new RegExp(query.search, "i");
  const { limit, skip } = paging(query);
  const [items, total] = await Promise.all([
    view(AssetVerification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)),
    AssetVerification.countDocuments(filter)
  ]);
  return { items, total, limit, skip };
}

export async function listVerifications(query) {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.auditor) filter.auditor = query.auditor;
  if (query.auditTask) filter.auditTask = query.auditTask;
  if (query.search) filter.productName = new RegExp(query.search, "i");
  const { limit, skip } = paging(query);
  const [items, total] = await Promise.all([
    view(AssetVerification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)),
    AssetVerification.countDocuments(filter)
  ]);
  return { items, total, limit, skip };
}

function csvEscape(value) {
  const s = value === undefined || value === null ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function exportApprovedCsv() {
  const rows = await view(AssetVerification.find({ status: "mis_approved" }).sort({ misVerifiedAt: -1 }));
  const header = ["Task Code", "Auditor", "Product", "Sub-Product", "Condition", "Damage Criteria", "Base Cost", "Tentative Cost", "Actual Cost", "MIS Verifier", "MIS Verified At", "Remarks", "MIS Remarks"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push([
      r.auditTask?.taskCode,
      r.auditor?.name,
      r.productName,
      r.customSubProductName,
      r.conditionRating?.name,
      r.selectedDamageCriteria?.map((d) => d.name).join("; "),
      r.baseCost,
      r.tentativeCost,
      r.actualCost,
      r.misVerifier?.name,
      r.misVerifiedAt ? new Date(r.misVerifiedAt).toISOString() : "",
      r.remarks,
      r.misRemarks
    ].map(csvEscape).join(","));
  }
  return lines.join("\n");
}
