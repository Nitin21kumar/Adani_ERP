import { asyncHandler } from "../../core/utils/asyncHandler.js";
import { createDepartment, listDepartments, updateDepartment } from "./department.service.js";
import Department from "./department.model.js";
import { ApiError } from "../../core/utils/ApiError.js";
export const list = asyncHandler(async (_req, res) => res.json(await listDepartments()));
export const create = asyncHandler(async (req, res) => res.status(201).json(await createDepartment(req.body)));
export const update = asyncHandler(async (req, res) => res.json(await updateDepartment(req.params.id, req.body)));
export const remove = asyncHandler(async (req, res) => { const record = await Department.findByIdAndUpdate(req.params.id, { isActive: false }); if (!record) throw new ApiError(404, "Department not found"); res.json({ message: "Department deactivated" }); });
