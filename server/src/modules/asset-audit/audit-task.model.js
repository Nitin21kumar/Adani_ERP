import mongoose from "mongoose";

const schema = new mongoose.Schema({
  taskCode: { type: String, required: true, unique: true, trim: true },
  title: { type: String, trim: true },
  auditor: { type: mongoose.Schema.Types.ObjectId, ref: "AuditUser", required: true },
  status: { type: String, enum: ["assigned", "in_progress", "completed"], default: "assigned" },
  assignedAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "AuditUser", required: true },
  notes: String
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

export default mongoose.model("AuditTask", schema);
