import { asyncHandler } from "../../core/utils/asyncHandler.js";
import * as service from "./daily-report.service.js";
export const submit = asyncHandler(async (req, res) => res.status(201).json(await service.submitReport(req.employee, req.body)));
export const update = asyncHandler(async (req, res) => res.json(await service.updateReport(req.params.id, req.employee, req.body)));
export const today = asyncHandler(async (req, res) => res.json(await service.todayReport(req.employee)));
export const mine = asyncHandler(async (req, res) => res.json(await service.myReports(req.employee, req.query)));
export const list = asyncHandler(async (req, res) => res.json(await service.listReports(req.query)));
export const comment = asyncHandler(async (req, res) => res.json(await service.addComment(req.params.id, req.body.comment)));
