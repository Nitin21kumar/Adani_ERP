import mongoose from "mongoose";
const schema = new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, type: { type: String, default: "general" }, title: { type: String, required: true }, message: { type: String, required: true }, is_read: { type: Boolean, default: false }, read_at: Date }, { timestamps: true });
export default mongoose.model("Notification", schema);
