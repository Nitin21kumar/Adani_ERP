import { asyncHandler } from "../../core/utils/asyncHandler.js";
import * as service from "./audit-notification.service.js";

export const list = asyncHandler(async (req, res) => res.json(await service.listNotifications(req.auditUser.role, req.query)));
export const markRead = asyncHandler(async (req, res) => { await service.markRead(req.params.id, req.auditUser.role); res.json({ message: "Marked as read" }); });
export const markAllRead = asyncHandler(async (req, res) => { await service.markAllRead(req.auditUser.role); res.json({ message: "All marked as read" }); });
