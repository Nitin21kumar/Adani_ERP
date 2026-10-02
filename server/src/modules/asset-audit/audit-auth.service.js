import AuditUser from "./audit-user.model.js";
import { ApiError } from "../../core/utils/ApiError.js";
import { signAuditAccessToken } from "./audit.tokens.js";

export const safeAuditUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, status: u.status, createdAt: u.createdAt });

export async function authenticateAuditUser(email, password) {
  const user = await AuditUser.findOne({ email: String(email).toLowerCase() }).select("+password");
  if (!user || !(await user.matchesPassword(password))) throw new ApiError(401, "Invalid email or password");
  if (user.status !== "active") throw new ApiError(403, "Account is inactive. Contact an audit admin.");
  return { access_token: signAuditAccessToken(user), token_type: "bearer", user: safeAuditUser(user) };
}
