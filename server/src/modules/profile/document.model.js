import mongoose from "mongoose";
const schema = new mongoose.Schema({ employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true }, file_name: { type: String, required: true }, file_url: { type: String, required: true }, file_type: String, doc_category: String }, { timestamps: true });
export default mongoose.model("Document", schema);
