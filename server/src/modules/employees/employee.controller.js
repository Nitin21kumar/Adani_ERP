import { asyncHandler } from "../../core/utils/asyncHandler.js";
import Employee from "./employee.model.js";
import { createEmployee, employeeDto, employeeView, listEmployees, setStatus, updateEmployee } from "./employee.service.js";
import { ApiError } from "../../core/utils/ApiError.js";

export const create = asyncHandler(async (req, res) => res.status(201).json(await createEmployee(req.body)));
export const list = asyncHandler(async (req, res) => res.json(await listEmployees(req.query)));
export const getOne = asyncHandler(async (req, res) => { const employee = await employeeView(Employee.findOne({ _id: req.params.id, isDeleted: false })); if (!employee) throw new ApiError(404, "Employee not found"); res.json(employeeDto(employee)); });
export const update = asyncHandler(async (req, res) => res.json(await updateEmployee(req.params.id, req.body)));
export const block = asyncHandler(async (req, res) => res.json(await setStatus(req.params.id, "blocked")));
export const activate = asyncHandler(async (req, res) => res.json(await setStatus(req.params.id, "active")));
export const remove = asyncHandler(async (req, res) => { const employee = await Employee.findOne({ _id: req.params.id, isDeleted: false }); if (!employee) throw new ApiError(404, "Employee not found"); employee.isDeleted = true; await employee.save(); await setStatus(employee.id, "blocked"); res.json({ message: "Employee has been deactivated." }); });
