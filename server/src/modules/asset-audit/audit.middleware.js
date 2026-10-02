import AuditUser from "./audit-user.model.js";
import { ApiError } from "../../core/utils/ApiError.js";
import { verifyAuditAccessToken } from "./audit.tokens.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";

export const AUDIT_ROLES = ["audit_admin", "auditor", "mis_verifier"];

// Mirrors core/middleware/auth.js in shape only — reads its own bearer token
// against the audit-only secret and sets req.auditUser, never req.user. The
// existing Employee ERP `protect`/`allow` middleware is untouched and these
// two never call into each other.
export const auditProtect = asyncHandler(async (req, _res, next) => {
  const token = req.headers.authorization?.startsWith("Bearer ") && req.headers.authorization.slice(7);
  if (!token) throw new ApiError(401, "Authentication required");
  let payload;
  try { payload = verifyAuditAccessToken(token); } catch { throw new ApiError(401, "Invalid or expired token"); }
  const auditUser = await AuditUser.findById(payload.sub);
  if (!auditUser || auditUser.status !== "active") throw new ApiError(401, "Account is unavailable");
  req.auditUser = auditUser;
  next();
});

export const auditAllow = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.auditUser.role)) return next(new ApiError(403, "You do not have permission for this action"));
  next();
};
