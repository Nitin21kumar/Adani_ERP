import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true },
  status: { type: String, enum: ["pending", "active", "blocked"], default: "active" },
  isEmailVerified: { type: Boolean, default: false }, lastLoginAt: Date,
  refreshTokens: [{ token: String, createdAt: { type: Date, default: Date.now } }],
  passwordReset: { token: String, expiresAt: Date }
}, { timestamps: true, toJSON: { virtuals: true } });
userSchema.virtual("employee", { ref: "Employee", localField: "_id", foreignField: "user", justOne: true });
userSchema.pre("save", async function save(next) { if (!this.isModified("password")) return next(); this.password = await bcrypt.hash(this.password, 12); next(); });
userSchema.methods.matchesPassword = function matchesPassword(value) { return bcrypt.compare(value, this.password); };
export default mongoose.model("User", userSchema);
