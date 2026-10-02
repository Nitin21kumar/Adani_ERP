import DailyReport from "./daily-report.model.js";
import Employee from "../employees/employee.model.js";
import { ApiError } from "../../core/utils/ApiError.js";
import { dateRange, paging } from "../../core/utils/query.js";
const today = () => { const value = new Date(); value.setHours(0, 0, 0, 0); return value; };
const view = (query) => query.populate({ path: "employee", select: "full_name employee_code department", populate: { path: "department", select: "name" } });
export async function submitReport(employee, body) { if (!employee) throw new ApiError(400, "An employee profile is required"); const report_date = body.report_date ? new Date(body.report_date) : today(); return DailyReport.create({ ...body, employee: employee.id, report_date }); }
export async function updateReport(id, employee, body) { const report = await DailyReport.findOne({ _id: id, employee: employee?.id }); if (!report) throw new ApiError(404, "Daily report not found"); if (report.report_date.toDateString() !== new Date().toDateString()) throw new ApiError(400, "Only today's report can be changed"); Object.assign(report, body); await report.save(); return report; }
export const todayReport = (employee) => view(DailyReport.findOne({ employee: employee?.id, report_date: { $gte: today(), $lt: new Date(today().getTime() + 86400000) } }));
export const myReports = (employee, query) => { const { limit, skip } = paging(query); return view(DailyReport.find({ employee: employee?.id }).sort({ report_date: -1 }).skip(skip).limit(limit)); };
export async function listReports(query) { const filter = { ...dateRange(query, "report_date") }; if (query.employee_id) filter.employee = query.employee_id; if (query.status) filter.status = query.status; if (query.department_id) { const employees = await Employee.find({ department: query.department_id }).select("_id"); filter.employee = { $in: employees }; } return view(DailyReport.find(filter).sort({ report_date: -1 })); }
export async function addComment(id, comment) { const report = await DailyReport.findByIdAndUpdate(id, { admin_comments: comment }, { new: true }); if (!report) throw new ApiError(404, "Daily report not found"); return report; }
