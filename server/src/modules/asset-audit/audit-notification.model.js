import mongoose from "mongoose";

const schema = new mongoose.Schema({
  // Broadcast to a role rather than one user — any MIS Verifier who reads it
  // dismisses it for the whole team, matching how small back-office queues
  // typically work. Extend with a per-user recipient later if needed.
  role: { type: String, enum: ["audit_admin", "auditor", "mis_verifier"], required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  verification: { type: mongoose.Schema.Types.ObjectId, ref: "AssetVerification" },
  read: { type: Boolean, default: false }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

schema.index({ role: 1, read: 1, createdAt: -1 });

export default mongoose.model("AuditNotification", schema);
