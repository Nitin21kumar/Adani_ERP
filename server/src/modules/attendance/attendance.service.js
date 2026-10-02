import Attendance from "./attendance.model.js";
import { ApiError } from "../../core/utils/ApiError.js";
import { dateRange, paging } from "../../core/utils/query.js";

const todayRange = () => { const start = new Date(); start.setHours(0, 0, 0, 0); const end = new Date(start); end.setDate(end.getDate() + 1); return { $gte: start, $lt: end }; };
const location = (body, event_type) => ({ event_type, latitude: body.latitude, longitude: body.longitude, full_address: body.full_address });
export async function checkIn(employee, body, ip) {
  if (!employee) throw new ApiError(400, "An employee profile is required for attendance");
  const exists = await Attendance.findOne({ employee: employee.id, date: todayRange() });
  if (exists) throw new ApiError(409, "Already checked in today");
  return Attendance.create({ employee: employee.id, date: new Date(), login_time: new Date(), browser: body.browser, os: body.os, device: body.device, ip_address: ip, login_verification_photo_url: body.verification_photo_url, login_verification_photo_status: body.verification_photo_status, locations: [location(body, "login")] });
}
export async function checkOut(employee, body) {
  const attendance = await Attendance.findOne({ employee: employee?.id, date: todayRange() });
  if (!attendance) throw new ApiError(400, "No attendance check-in found for today");
  if (attendance.logout_time) throw new ApiError(409, "Already checked out today");
  attendance.logout_time = new Date(); attendance.working_hours = Number(((attendance.logout_time - attendance.login_time) / 3600000).toFixed(2)); attendance.logout_verification_photo_url = body.verification_photo_url; attendance.logout_verification_photo_status = body.verification_photo_status; attendance.locations.push(location(body, "logout")); await attendance.save(); return attendance;
}
export const today = (employee) => Attendance.findOne({ employee: employee?.id, date: todayRange() }).populate("employee", "full_name employee_code");
export const history = (employee, query) => { const { limit, skip } = paging(query); return Attendance.find({ employee: employee?.id }).populate("employee", "full_name employee_code").sort({ date: -1 }).skip(skip).limit(limit); };
export async function listAttendance(query) { const filter = { ...dateRange(query, "date") }; if (query.employee_id) filter.employee = query.employee_id; if (query.status) filter.status = query.status; const { limit, skip } = paging(query); return Attendance.find(filter).populate({ path: "employee", select: "full_name employee_code department", populate: { path: "department", select: "name" } }).sort({ date: -1 }).skip(skip).limit(limit); }
