import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ["audit_admin", "auditor", "mis_verifier"], required: true },
  status: { type: String, enum: ["active", "inactive"], default: "active" }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

schema.pre("save", async function save(next) { if (!this.isModified("password")) return next(); this.password = await bcrypt.hash(this.password, 12); next(); });
schema.methods.matchesPassword = function matchesPassword(value) { return bcrypt.compare(value, this.password); };

export default mongoose.model("AuditUser", schema);
