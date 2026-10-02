import ConditionRating from "./condition-rating.model.js";
import { ApiError } from "../../core/utils/ApiError.js";

export async function createConditionRating(payload) {
  if (await ConditionRating.exists({ name: payload.name })) throw new ApiError(409, "Condition rating already exists");
  return ConditionRating.create({ name: payload.name, valuationPercentage: payload.valuationPercentage, active: payload.active !== undefined ? payload.active : true });
}

export async function listConditionRatings(query) {
  const filter = {};
  if (query.active !== undefined) filter.active = query.active === "true" || query.active === true;
  return ConditionRating.find(filter).sort({ valuationPercentage: -1 });
}

export async function updateConditionRating(id, payload) {
  const record = await ConditionRating.findById(id);
  if (!record) throw new ApiError(404, "Condition rating not found");
  const allowed = ["valuationPercentage", "active"];
  allowed.forEach((key) => { if (payload[key] !== undefined) record[key] = payload[key]; });
  await record.save();
  return record;
}
