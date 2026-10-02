import mongoose from "mongoose";
const schema = new mongoose.Schema({ name: { type: String, required: true }, date: { type: Date, required: true }, description: String }, { timestamps: true });
schema.index({ date: 1 }, { unique: true });
export default mongoose.model("Holiday", schema);
