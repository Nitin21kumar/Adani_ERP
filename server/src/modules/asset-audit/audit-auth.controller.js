import { asyncHandler } from "../../core/utils/asyncHandler.js";
import { authenticateAuditUser, safeAuditUser } from "./audit-auth.service.js";

export const login = asyncHandler(async (req, res) => res.json(await authenticateAuditUser(req.body.email, req.body.password)));
export const me = asyncHandler(async (req, res) => res.json(safeAuditUser(req.auditUser)));
