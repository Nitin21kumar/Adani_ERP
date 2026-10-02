import mongoose from "mongoose";
const schema = new mongoose.Schema({ employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true }, changes: { type: mongoose.Schema.Types.Mixed, required: true }, status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" }, reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, review_comment: String }, { timestamps: true });
export default mongoose.model("ProfileChangeRequest", schema);
