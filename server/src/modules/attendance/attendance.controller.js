import { asyncHandler } from "../../core/utils/asyncHandler.js";
import * as service from "./attendance.service.js";
export const login = asyncHandler(async (req, res) => res.status(201).json(await service.checkIn(req.employee, req.body, req.ip)));
export const logout = asyncHandler(async (req, res) => res.json(await service.checkOut(req.employee, req.body)));
export const myToday = asyncHandler(async (req, res) => res.json(await service.today(req.employee)));
export const myHistory = asyncHandler(async (req, res) => res.json(await service.history(req.employee, req.query)));
export const list = asyncHandler(async (req, res) => res.json(await service.listAttendance(req.query)));
