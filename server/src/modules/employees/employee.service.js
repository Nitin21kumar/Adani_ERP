import crypto from "node:crypto";
import Employee from "./employee.model.js";
import User from "../auth/user.model.js";
import { getRole } from "../auth/auth.service.js";
import { ApiError } from "../../core/utils/ApiError.js";
import { paging } from "../../core/utils/query.js";

const idOf = (value) => value?._id?.toString() || value?.toString() || null;
export function employeeDto(record) {
  if (!record) return null;
  const value = record.toObject ? record.toObject() : record;
  const user = value.user || {};
  return { ...value, id: idOf(value), user_id: idOf(user), email: user.email, status: user.status, role: user.role, department_id: idOf(value.department), manager_id: idOf(value.manager), is_deleted: value.isDeleted, created_at: value.createdAt };
}
export const employeeView = (query) => query.populate({ path: "user", select: "email status role", populate: { path: "role", select: "name" } }).populate("department", "name").populate("manager", "full_name employee_code");
export async function createEmployee(payload) {
  if (await User.exists({ email: payload.email.toLowerCase() })) throw new ApiError(409, "Email already exists");
  if (await Employee.exists({ employee_code: payload.employee_code })) throw new ApiError(409, "Employee code already exists");
  const role = payload.role_id ? await getRoleById(payload.role_id) : await getRole(payload.role || "employee");
  const temporaryPassword = payload.password || crypto.randomBytes(9).toString("base64url");
  const user = await User.create({ email: payload.email, password: temporaryPassword, role: role.id, status: payload.status || "active" });
  try {
    const employee = await Employee.create({ ...payload, department: payload.department_id, manager: payload.manager_id, user: user.id });
    return { employee: employeeDto(await employeeView(Employee.findById(employee.id))), temporary_password: temporaryPassword };
  } catch (error) { await User.findByIdAndDelete(user.id); throw error; }
}
export async function listEmployees(query) {
  const filter = { isDeleted: false };
  if (query.department_id) filter.department = query.department_id;
  if (query.search) filter.$text = { $search: query.search };
  if (query.status) { const users = await User.find({ status: query.status }).select("_id"); filter.user = { $in: users.map((user) => user.id) }; }
  const { limit, skip } = paging(query);
  return (await employeeView(Employee.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit))).map(employeeDto);
}
export async function updateEmployee(id, payload) {
  const employee = await Employee.findOne({ _id: id, isDeleted: false });
  if (!employee) throw new ApiError(404, "Employee not found");
  const allowed = ["full_name", "phone", "photo_url", "emergency_contact_name", "emergency_contact_phone", "designation", "joining_date", "address", "department", "manager"];
  allowed.forEach((key) => { if (payload[key] !== undefined) employee[key] = payload[key]; });
  if (payload.department_id) employee.department = payload.department_id;
  if (payload.manager_id) employee.manager = payload.manager_id;
  if (payload.role || payload.role_id || payload.status) { const user = await User.findById(employee.user); if (payload.role) user.role = (await getRole(payload.role)).id; if (payload.role_id) user.role = (await getRoleById(payload.role_id)).id; if (payload.status) user.status = payload.status; await user.save(); }
  await employee.save(); return employeeDto(await employeeView(Employee.findById(employee.id)));
}
export async function setStatus(id, status) { const employee = await Employee.findOne({ _id: id, isDeleted: false }); if (!employee) throw new ApiError(404, "Employee not found"); await User.findByIdAndUpdate(employee.user, { status }); return employeeDto(await employeeView(Employee.findById(id))); }
async function getRoleById(id) { const role = await (await import("../auth/role.model.js")).default.findById(id); if (!role) throw new ApiError(400, "Invalid role"); return role; }
