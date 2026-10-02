import Employee from "../employees/employee.model.js";
import Document from "./document.model.js";
import ProfileChangeRequest from "./profile-change-request.model.js";
import { ApiError } from "../../core/utils/ApiError.js";
const employeeView = (query) => query.populate("department", "name").populate("manager", "full_name employee_code").populate({ path: "user", select: "email status role", populate: { path: "role", select: "name" } });
export const profile = (employee) => employeeView(Employee.findById(employee?.id));
export async function updatePhoto(employee, photo_url) { if (!employee) throw new ApiError(404, "Employee profile not found"); employee.photo_url = photo_url; await employee.save(); return profile(employee); }
export const documents = (employee) => Document.find({ employee: employee?.id }).sort({ createdAt: -1 });
export const addDocument = (employee, payload) => Document.create({ ...payload, employee: employee.id });
export async function removeDocument(employee, id) { const document = await Document.findOneAndDelete({ _id: id, employee: employee?.id }); if (!document) throw new ApiError(404, "Document not found"); }
export const submitChange = (employee, changes) => ProfileChangeRequest.create({ employee: employee.id, changes });
export const latestChange = (employee) => ProfileChangeRequest.findOne({ employee: employee?.id }).sort({ createdAt: -1 });
export const listChanges = (status) => ProfileChangeRequest.find(status ? { status } : {}).populate("employee", "full_name employee_code").sort({ createdAt: -1 });
export async function reviewChange(id, status, reviewer, comment) { const request = await ProfileChangeRequest.findById(id); if (!request) throw new ApiError(404, "Profile change request not found"); if (request.status !== "pending") throw new ApiError(409, "Only pending requests can be reviewed"); request.status = status; request.reviewed_by = reviewer.id; request.review_comment = comment; await request.save(); if (status === "approved") await Employee.findByIdAndUpdate(request.employee, request.changes); return request; }
