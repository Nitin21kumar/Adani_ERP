import { asyncHandler } from "../../core/utils/asyncHandler.js";
import { ApiError } from "../../core/utils/ApiError.js";
import * as service from "./settings.service.js";
export const publicSettings = asyncHandler(async (_req, res) => { const record = await service.company(); res.json({ company_name: record.company_name, company_logo: record.company_logo, camera_verification_enabled: record.camera_verification_enabled }); });
export const getCompany = asyncHandler(async (_req, res) => res.json(await service.company()));
export const updateCompany = asyncHandler(async (req, res) => res.json(await service.updateCompany(req.body)));
export const listHolidays = asyncHandler(async (req, res) => res.json(await service.holidays(req.query.year)));
export const createHoliday = asyncHandler(async (req, res) => res.status(201).json(await service.addHoliday(req.body)));
export const deleteHoliday = asyncHandler(async (req, res) => { const record = await service.removeHoliday(req.params.id); if (!record) throw new ApiError(404, "Holiday not found"); res.json({ message: "Holiday deleted" }); });
