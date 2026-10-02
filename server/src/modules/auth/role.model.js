import mongoose from "mongoose";
const roleSchema = new mongoose.Schema({ name: { type: String, required: true, unique: true, enum: ["super_admin", "admin", "hr", "manager", "employee"] }, permissions: [String] }, { timestamps: true });
export default mongoose.model("Role", roleSchema);
