import { asyncHandler } from "../../core/utils/asyncHandler.js";
import { dashboardSummary } from "./dashboard.service.js";

export const summary = asyncHandler(async (req, res) => res.json(await dashboardSummary(req.auditUser)));
