import { asyncHandler } from "../../core/utils/asyncHandler.js";
import { getVerification } from "./verification.service.js";
import * as service from "./mis.service.js";

export const pending = asyncHandler(async (req, res) => res.json(await service.pendingVerifications(req.query)));
export const getOne = asyncHandler(async (req, res) => res.json(await getVerification(req.params.id, req.auditUser)));
export const approve = asyncHandler(async (req, res) => res.json(await service.approveVerification(req.params.id, req.auditUser, req.body)));
export const returnToAuditor = asyncHandler(async (req, res) => res.json(await service.returnVerification(req.params.id, req.auditUser, req.body)));
