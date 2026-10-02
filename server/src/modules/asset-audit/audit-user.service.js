import AuditUser from "./audit-user.model.js";
import { ApiError } from "../../core/utils/ApiError.js";
import { paging } from "../../core/utils/query.js";
import { safeAuditUser } from "./audit-auth.service.js";

export async function createAuditUser(payload) {
  if (await AuditUser.exists({ email: String(payload.email).toLowerCase() })) throw new ApiError(409, "Email already exists");
  const user = await AuditUser.create({ name: payload.name, email: payload.email, password: payload.password, role: payload.role, status: payload.status || "active" });
  return safeAuditUser(user);
}

export async function listAuditUsers(query) {
  const filter = {};
  if (query.role) filter.role = query.role;
  if (query.status) filter.status = query.status;
  if (query.search) filter.$or = [{ name: new RegExp(query.search, "i") }, { email: new RegExp(query.search, "i") }];
  const { limit, skip } = paging(query);
  const [items, total] = await Promise.all([
    AuditUser.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    AuditUser.countDocuments(filter)
  ]);
  return { items: items.map(safeAuditUser), total, limit, skip };
}

export async function updateAuditUser(id, payload) {
  const user = await AuditUser.findById(id);
  if (!user) throw new ApiError(404, "Audit user not found");
  const allowed = ["name", "role", "status"];
  allowed.forEach((key) => { if (payload[key] !== undefined) user[key] = payload[key]; });
  if (payload.password) user.password = payload.password;
  await user.save();
  return safeAuditUser(user);
}
