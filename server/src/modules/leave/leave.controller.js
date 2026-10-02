import { asyncHandler } from "../../core/utils/asyncHandler.js";
import * as service from "./leave.service.js";
export const apply = asyncHandler(async (req, res) => res.status(201).json(await service.applyLeave(req.employee, req.body)));
export const mine = asyncHandler(async (req, res) => res.json(await service.myLeaves(req.employee)));
export const list = asyncHandler(async (req, res) => res.json(await service.listLeaves(req.query)));
export const approve = asyncHandler(async (req, res) => res.json(await service.decideLeave(req.params.id, "approved", req.user, req.body.comment)));
export const reject = asyncHandler(async (req, res) => res.json(await service.decideLeave(req.params.id, "rejected", req.user, req.body.comment)));
