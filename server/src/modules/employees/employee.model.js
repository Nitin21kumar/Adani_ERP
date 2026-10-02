import mongoose from "mongoose";
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, required: true },
  employee_code: { type: String, unique: true, required: true, trim: true }, full_name: { type: String, required: true }, phone: String, photo_url: String,
  emergency_contact_name: String, emergency_contact_phone: String, designation: String, joining_date: Date, address: String,
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" }, manager: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });
schema.index({ full_name: "text", employee_code: "text" });
export default mongoose.model("Employee", schema);
