import LeaveRequest from "./leave.model.js";
import Employee from "../employees/employee.model.js";
import { ApiError } from "../../core/utils/ApiError.js";

const view = (query) => query.populate({ path: "employee", select: "full_name employee_code department", populate: { path: "department", select: "name" } }).populate("reviewed_by", "email");
export const applyLeave = (employee, body) => { if (!employee) throw new ApiError(400, "An employee profile is required"); return LeaveRequest.create({ ...body, employee: employee.id }); };
export const myLeaves = (employee) => view(LeaveRequest.find({ employee: employee?.id }).sort({ createdAt: -1 }));
export async function listLeaves(query) { const filter = {}; if (query.status) filter.status = query.status; if (query.department_id) { const employees = await Employee.find({ department: query.department_id }).select("_id"); filter.employee = { $in: employees }; } return view(LeaveRequest.find(filter).sort({ createdAt: -1 })); }
export async function decideLeave(id, status, reviewer, comment) { const record = await LeaveRequest.findById(id); if (!record) throw new ApiError(404, "Leave request not found"); if (record.status !== "pending") throw new ApiError(409, "Only pending requests can be reviewed"); record.status = status; record.reviewed_by = reviewer.id; record.review_comment = comment; await record.save(); return view(LeaveRequest.findById(id)); }
