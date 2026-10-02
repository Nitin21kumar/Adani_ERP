import { asyncHandler } from "../../core/utils/asyncHandler.js";
import Notification from "./notification.model.js";
import { ApiError } from "../../core/utils/ApiError.js";
export const mine = asyncHandler(async (req, res) => res.json(await Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(Math.min(Number(req.query.limit) || 50, 200))));
export const read = asyncHandler(async (req, res) => { const record = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, { is_read: true, read_at: new Date() }, { new: true }); if (!record) throw new ApiError(404, "Notification not found"); res.json(record); });
export const readAll = asyncHandler(async (req, res) => { const result = await Notification.updateMany({ user: req.user.id, is_read: false }, { is_read: true, read_at: new Date() }); res.json({ marked_read: result.modifiedCount }); });
