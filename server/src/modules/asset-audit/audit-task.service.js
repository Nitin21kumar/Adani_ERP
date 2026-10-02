import AuditTask from "./audit-task.model.js";
import AuditUser from "./audit-user.model.js";
import { ApiError } from "../../core/utils/ApiError.js";
import { paging } from "../../core/utils/query.js";

const view = (query) => query.populate("auditor", "name email").populate("createdBy", "name email");

async function nextTaskCode() {
  const count = await AuditTask.countDocuments();
  return `AT${String(count + 1).padStart(4, "0")}`;
}

export async function createTask(payload, createdBy) {
  const auditor = await AuditUser.findOne({ _id: payload.auditor, role: "auditor" });
  if (!auditor) throw new ApiError(400, "Select a valid auditor");
  let taskCode = payload.taskCode?.trim().toUpperCase();
  if (taskCode && (await AuditTask.exists({ taskCode }))) throw new ApiError(409, "Task code already exists");
  if (!taskCode) taskCode = await nextTaskCode();
  const task = await AuditTask.create({ taskCode, title: payload.title, auditor: auditor.id, notes: payload.notes, createdBy: createdBy.id });
  return view(AuditTask.findById(task.id));
}

export async function listTasks(query) {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.auditor) filter.auditor = query.auditor;
  if (query.search) filter.$or = [{ taskCode: new RegExp(query.search, "i") }, { title: new RegExp(query.search, "i") }];
  const { limit, skip } = paging(query);
  const [items, total] = await Promise.all([
    view(AuditTask.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)),
    AuditTask.countDocuments(filter)
  ]);
  return { items, total, limit, skip };
}

export async function updateTask(id, payload) {
  const task = await AuditTask.findById(id);
  if (!task) throw new ApiError(404, "Audit task not found");
  if (payload.auditor) {
    const auditor = await AuditUser.findOne({ _id: payload.auditor, role: "auditor" });
    if (!auditor) throw new ApiError(400, "Select a valid auditor");
    task.auditor = auditor.id;
  }
  if (payload.status) task.status = payload.status;
  if (payload.title !== undefined) task.title = payload.title;
  if (payload.notes !== undefined) task.notes = payload.notes;
  await task.save();
  return view(AuditTask.findById(task.id));
}

export async function myTasks(auditor, query) {
  const filter = { auditor: auditor.id };
  if (query.status) filter.status = query.status;
  const { limit, skip } = paging(query);
  const [items, total] = await Promise.all([
    view(AuditTask.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)),
    AuditTask.countDocuments(filter)
  ]);
  return { items, total, limit, skip };
}

// A task covers one location/site visit and can hold many asset
// verifications — there's no fixed count to auto-detect "done" from, so the
// auditor explicitly closes it out once they've finished auditing that site.
export async function completeMyTask(auditor, id) {
  const task = await AuditTask.findOne({ _id: id, auditor: auditor.id });
  if (!task) throw new ApiError(404, "Audit task not found or not assigned to you");
  task.status = "completed";
  await task.save();
  return view(AuditTask.findById(task.id));
}
