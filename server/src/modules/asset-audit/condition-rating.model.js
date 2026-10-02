import mongoose from "mongoose";

const schema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true, enum: ["Very Good", "Good", "Satisfactory", "Repairable", "Poor", "Non-functional", "Obsolete / Missing"] },
  valuationPercentage: { type: Number, required: true, min: 0, max: 100 },
  active: { type: Boolean, default: true }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

export default mongoose.model("ConditionRating", schema);
