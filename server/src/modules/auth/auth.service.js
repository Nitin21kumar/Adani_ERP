import crypto from "node:crypto";
import User from "./user.model.js";
import Role from "./role.model.js";
import Employee from "../employees/employee.model.js";
import { ApiError } from "../../core/utils/ApiError.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../core/utils/tokens.js";

const safeUser = (user) => ({ id: user.id, email: user.email, status: user.status, role: user.role, employee: user.employee });

export async function authenticate(username, password) {
  const user = await User.findOne({ email: username.toLowerCase() }).select("+password").populate("role");
  const employee = user ? null : await Employee.findOne({ employee_code: username, isDeleted: false }).populate({ path: "user", populate: "role" });
  const account = user || employee?.user;
  if (!account || !(await account.matchesPassword(password))) throw new ApiError(401, "Invalid email/employee ID or password");
  if (account.status !== "active") throw new ApiError(403, "Account is blocked. Contact an administrator.");
  account.lastLoginAt = new Date();
  const refresh_token = signRefreshToken(account);
  account.refreshTokens = [{ token: refresh_token }];
  await account.save();
  return { access_token: signAccessToken(account), refresh_token };
}

export async function refreshSession(refreshToken) {
  const { sub } = verifyRefreshToken(refreshToken);
  const user = await User.findById(sub).populate("role");
  if (!user || !user.refreshTokens.some((entry) => entry.token === refreshToken)) throw new ApiError(401, "Invalid refresh token");
  const next = signRefreshToken(user);
  user.refreshTokens = [{ token: next }];
  await user.save();
  return { access_token: signAccessToken(user), refresh_token: next };
}

export async function createPasswordReset(identifier) {
  const user = await User.findOne({ email: identifier.toLowerCase() }) || (await Employee.findOne({ employee_code: identifier }).populate("user"))?.user;
  if (!user) return null;
  const token = crypto.randomBytes(32).toString("hex");
  user.passwordReset = { token: crypto.createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 3600000) };
  await user.save();
  return { user, token };
}

export async function resetPassword(token, password) {
  const digest = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({ "passwordReset.token": digest, "passwordReset.expiresAt": { $gt: new Date() } }).select("+password");
  if (!user) throw new ApiError(400, "Invalid or expired reset token");
  user.password = password; user.passwordReset = undefined; user.refreshTokens = []; await user.save();
}

export async function getRole(name) { const role = await Role.findOne({ name }); if (!role) throw new ApiError(400, "Invalid role"); return role; }
export { safeUser };
