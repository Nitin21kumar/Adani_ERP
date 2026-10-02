import WfhRequest from "./wfh.model.js";
import Employee from "../employees/employee.model.js";
import { ApiError } from "../../core/utils/ApiError.js";
const view = (query) => query.populate({ path: "employee", select: "full_name employee_code department", populate: { path: "department", select: "name" } }).populate("reviewed_by", "email");
export const applyWfh = (employee, body) => { if (!employee) throw new ApiError(400, "An employee profile is required"); return WfhRequest.create({ ...body, employee: employee.id }); };
export const myWfh = (employee) => view(WfhRequest.find({ employee: employee?.id }).sort({ createdAt: -1 }));
export async function listWfh(query) { const filter = {}; if (query.status) filter.status = query.status; if (query.department_id) { const employees = await Employee.find({ department: query.department_id }).select("_id"); filter.employee = { $in: employees }; } return view(WfhRequest.find(filter).sort({ createdAt: -1 })); }
export async function decideWfh(id, status, reviewer, comment) { const record = await WfhRequest.findById(id); if (!record) throw new ApiError(404, "WFH request not found"); if (record.status !== "pending") throw new ApiError(409, "Only pending requests can be reviewed"); record.status = status; record.reviewed_by = reviewer.id; record.review_comment = comment; await record.save(); return view(WfhRequest.findById(id)); }
