import Attendance from "../attendance/attendance.model.js";
import LeaveRequest from "../leave/leave.model.js";
import WfhRequest from "../work-from-home/wfh.model.js";
import DailyReport from "../daily-reports/daily-report.model.js";
import Employee from "../employees/employee.model.js";
import Department from "../departments/department.model.js";
import { dateRange } from "../../core/utils/query.js";

const models = { attendance: Attendance, leave: LeaveRequest, "daily-reports": DailyReport, employees: Employee, departments: Department, wfh: WfhRequest };
export async function report(type, query) { const Model = models[type]; if (!Model) return []; const field = type === "attendance" ? "date" : type === "daily-reports" ? "report_date" : type === "leave" || type === "wfh" ? "from_date" : "createdAt"; const filter = dateRange(query, field); return Model.find(filter).populate?.("employee", "full_name employee_code") || Model.find(filter); }
export async function summary() { const start = new Date(); start.setHours(0, 0, 0, 0); const [totalEmployees, presentToday, pendingLeaves, pendingWfh, reportsToday] = await Promise.all([Employee.countDocuments({ isDeleted: false }), Attendance.countDocuments({ date: { $gte: start } }), LeaveRequest.countDocuments({ status: "pending" }), WfhRequest.countDocuments({ status: "pending" }), DailyReport.countDocuments({ report_date: { $gte: start } })]); return { total_employees: totalEmployees, present_today: presentToday, pending_leaves: pendingLeaves, pending_wfh: pendingWfh, reports_today: reportsToday }; }
