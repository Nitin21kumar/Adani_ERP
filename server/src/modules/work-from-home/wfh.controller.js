import { asyncHandler } from "../../core/utils/asyncHandler.js";
import * as service from "./wfh.service.js";
export const apply = asyncHandler(async (req, res) => res.status(201).json(await service.applyWfh(req.employee, req.body)));
export const mine = asyncHandler(async (req, res) => res.json(await service.myWfh(req.employee)));
export const list = asyncHandler(async (req, res) => res.json(await service.listWfh(req.query)));
export const approve = asyncHandler(async (req, res) => res.json(await service.decideWfh(req.params.id, "approved", req.user, req.body.comment)));
export const reject = asyncHandler(async (req, res) => res.json(await service.decideWfh(req.params.id, "rejected", req.user, req.body.comment)));
