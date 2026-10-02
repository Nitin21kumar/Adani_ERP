import { asyncHandler } from "../../core/utils/asyncHandler.js";
import * as service from "./audit-task.service.js";

export const create = asyncHandler(async (req, res) => res.status(201).json(await service.createTask(req.body, req.auditUser)));
export const list = asyncHandler(async (req, res) => res.json(await service.listTasks(req.query)));
export const update = asyncHandler(async (req, res) => res.json(await service.updateTask(req.params.id, req.body)));
export const mine = asyncHandler(async (req, res) => res.json(await service.myTasks(req.auditUser, req.query)));
export const complete = asyncHandler(async (req, res) => res.json(await service.completeMyTask(req.auditUser, req.params.id)));
