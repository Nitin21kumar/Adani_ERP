import { asyncHandler } from "../../core/utils/asyncHandler.js";
import * as service from "./report.service.js";
export const getReport = asyncHandler(async (req, res) => { const records = await service.report(req.params.type, req.query); if (req.query.format && req.query.format !== "json") return res.status(501).json({ detail: "CSV, Excel and PDF export adapters can be configured in core/integrations." }); res.json(records); });
export const summary = asyncHandler(async (_req, res) => res.json(await service.summary()));
