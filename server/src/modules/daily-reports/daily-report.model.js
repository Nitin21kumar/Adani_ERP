import mongoose from "mongoose";
const schema = new mongoose.Schema({ employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true }, report_date: { type: Date, required: true }, title: { type: String, required: true }, project: String, task_description: { type: String, required: true }, hours_worked: { type: Number, default: 0 }, priority: { type: String, default: "medium" }, attachment_url: String, status: { type: String, default: "submitted" }, admin_comments: String }, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });
schema.index({ employee: 1, report_date: 1 }, { unique: true });
export default mongoose.model("DailyReport", schema);
