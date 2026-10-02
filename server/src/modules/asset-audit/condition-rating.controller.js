import { asyncHandler } from "../../core/utils/asyncHandler.js";
import * as service from "./condition-rating.service.js";

export const create = asyncHandler(async (req, res) => res.status(201).json(await service.createConditionRating(req.body)));
export const list = asyncHandler(async (req, res) => res.json(await service.listConditionRatings(req.query)));
export const update = asyncHandler(async (req, res) => res.json(await service.updateConditionRating(req.params.id, req.body)));
