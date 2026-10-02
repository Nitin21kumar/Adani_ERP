import { asyncHandler } from "../../core/utils/asyncHandler.js";
import { ApiError } from "../../core/utils/ApiError.js";
import { authenticate, createPasswordReset, refreshSession, resetPassword, safeUser } from "./auth.service.js";
import { sendEmail } from "../../core/integrations/emailService.js";

export const login = asyncHandler(async (req, res) => res.json(await authenticate(req.body.username, req.body.password)));
export const refresh = asyncHandler(async (req, res) => res.json(await refreshSession(req.body.refresh_token)));
export const me = asyncHandler(async (req, res) => { await req.user.populate("role"); await req.user.populate("employee"); res.json(safeUser(req.user)); });
export const logout = asyncHandler(async (req, res) => { req.user.refreshTokens = []; await req.user.save(); res.json({ message: "Logged out successfully." }); });
export const forgotPassword = asyncHandler(async (req, res) => { const reset = await createPasswordReset(req.body.identifier); if (reset) await sendEmail({ to: reset.user.email, subject: "Password reset", text: `Reset token: ${reset.token}` }); res.status(202).json({ message: "If that account exists, a reset link has been sent." }); });
export const reset = asyncHandler(async (req, res) => { await resetPassword(req.body.token, req.body.new_password); res.json({ message: "Password has been reset successfully." }); });
export const changePassword = asyncHandler(async (req, res) => { const user = await req.user.constructor.findById(req.user.id).select("+password"); if (!(await user.matchesPassword(req.body.old_password))) throw new ApiError(400, "Old password is incorrect"); user.password = req.body.new_password; user.refreshTokens = []; await user.save(); res.json({ message: "Password updated successfully" }); });
