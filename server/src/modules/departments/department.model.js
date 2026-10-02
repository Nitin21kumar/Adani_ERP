import mongoose from "mongoose";
const schema = new mongoose.Schema({ name: { type: String, required: true, unique: true, trim: true }, description: String, manager: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" }, isActive: { type: Boolean, default: true } }, { timestamps: true });
export default mongoose.model("Department", schema);
