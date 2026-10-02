import { asyncHandler } from "../../core/utils/asyncHandler.js";
import Role from "./role.model.js";
export const list = asyncHandler(async (_req, res) => { const roles = await Role.find().sort({ name: 1 }); res.json(roles.map((role) => ({ ...role.toObject(), id: role.id }))); });
