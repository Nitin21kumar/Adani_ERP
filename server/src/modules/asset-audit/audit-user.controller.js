import { asyncHandler } from "../../core/utils/asyncHandler.js";
import * as service from "./audit-user.service.js";

export const create = asyncHandler(async (req, res) => res.status(201).json(await service.createAuditUser(req.body)));
export const list = asyncHandler(async (req, res) => res.json(await service.listAuditUsers(req.query)));
export const update = asyncHandler(async (req, res) => res.json(await service.updateAuditUser(req.params.id, req.body)));
