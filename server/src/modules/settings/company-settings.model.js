import mongoose from "mongoose";
const schema = new mongoose.Schema({ company_name: { type: String, default: "Employee ERP System" }, company_logo: String, office_start_time: { type: String, default: "09:30" }, office_end_time: { type: String, default: "18:30" }, late_after_minutes: { type: Number, default: 15 }, camera_verification_enabled: { type: Boolean, default: false }, smtp: { host: String, port: Number, user: String, from: String } }, { timestamps: true });
export default mongoose.model("CompanySettings", schema);
