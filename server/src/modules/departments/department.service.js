import Department from "./department.model.js";
import { ApiError } from "../../core/utils/ApiError.js";
export const listDepartments = () => Department.find({ isActive: true }).sort({ name: 1 });
export const createDepartment = (payload) => Department.create(payload);
export async function updateDepartment(id, payload) { const record = await Department.findByIdAndUpdate(id, payload, { new: true, runValidators: true }); if (!record) throw new ApiError(404, "Department not found"); return record; }
