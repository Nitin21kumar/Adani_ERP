import mongoose from "mongoose";

const schema = new mongoose.Schema({
  auditTask: { type: mongoose.Schema.Types.ObjectId, ref: "AuditTask", required: true },
  auditor: { type: mongoose.Schema.Types.ObjectId, ref: "AuditUser", required: true },
  // Absent when isOtherProduct is true — the auditor typed a free-text
  // productName instead of picking one from Product Master (it wasn't
  // listed yet), so MIS gets notified to add it.
  product: { type: mongoose.Schema.Types.ObjectId, ref: "AuditProductMaster" },
  isOtherProduct: { type: Boolean, default: false },
  productName: { type: String, required: true },
  customSubProductName: { type: String, trim: true },
  selectedDamageCriteria: [{ type: mongoose.Schema.Types.ObjectId, ref: "DamageCriteria" }],
  conditionRating: { type: mongoose.Schema.Types.ObjectId, ref: "ConditionRating" },
  baseCost: { type: Number, required: true, min: 0 },
  tentativeCost: { type: Number, default: 0, min: 0 },
  actualCost: { type: Number, min: 0 },
  remarks: String,
  images: [{ type: String }],
  status: { type: String, enum: ["draft", "submitted_to_mis", "returned_for_correction", "mis_approved", "closed"], default: "draft" },
  auditorSubmittedAt: Date,
  misVerifiedAt: Date,
  misVerifier: { type: mongoose.Schema.Types.ObjectId, ref: "AuditUser" },
  misRemarks: String
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

schema.index({ status: 1 });
schema.index({ auditor: 1, status: 1 });

// Lets callers populate per-photo detail (location, uploadedAt) alongside
// the plain `images` URL array without changing that field's shape.
schema.virtual("imageDetails", { ref: "VerificationImage", localField: "_id", foreignField: "verification" });

export default mongoose.model("AssetVerification", schema);
