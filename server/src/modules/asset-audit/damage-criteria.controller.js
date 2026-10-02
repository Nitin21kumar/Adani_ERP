import { asyncHandler } from "../../core/utils/asyncHandler.js";
import * as service from "./damage-criteria.service.js";

export const create = asyncHandler(async (req, res) => res.status(201).json(await service.createDamageCriteria(req.body)));
export const list = asyncHandler(async (req, res) => res.json(await service.listDamageCriteria(req.query)));
export const update = asyncHandler(async (req, res) => res.json(await service.updateDamageCriteria(req.params.id, req.body)));
