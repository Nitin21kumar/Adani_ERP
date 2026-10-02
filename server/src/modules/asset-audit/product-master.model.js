import mongoose from "mongoose";

const schema = new mongoose.Schema({
  productName: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  subCategory: { type: String, trim: true },
  allowCustomSubProduct: { type: Boolean, default: false },
  defaultBaseCost: { type: Number, required: true, min: 0 },
  active: { type: Boolean, default: true }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

schema.index({ productName: "text", category: "text" });

export default mongoose.model("AuditProductMaster", schema);
