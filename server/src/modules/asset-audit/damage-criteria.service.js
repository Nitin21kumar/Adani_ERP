import DamageCriteria from "./damage-criteria.model.js";
import { ApiError } from "../../core/utils/ApiError.js";
import { paging } from "../../core/utils/query.js";

export async function createDamageCriteria(payload) {
  return DamageCriteria.create({ name: payload.name, category: payload.category, active: payload.active !== undefined ? payload.active : true });
}

export async function listDamageCriteria(query) {
  const filter = {};
  if (query.category) filter.category = query.category;
  if (query.active !== undefined) filter.active = query.active === "true" || query.active === true;
  const { limit, skip } = paging(query);
  const [items, total] = await Promise.all([
    DamageCriteria.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
    DamageCriteria.countDocuments(filter)
  ]);
  return { items, total, limit, skip };
}

export async function updateDamageCriteria(id, payload) {
  const record = await DamageCriteria.findById(id);
  if (!record) throw new ApiError(404, "Damage criteria not found");
  const allowed = ["name", "category", "active"];
  allowed.forEach((key) => { if (payload[key] !== undefined) record[key] = payload[key]; });
  await record.save();
  return record;
}
