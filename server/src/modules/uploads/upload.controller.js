import { ApiError } from "../../core/utils/ApiError.js";
export function uploadFile(req, res) { if (!req.file) throw new ApiError(400, "A file is required"); res.status(201).json({ url: `/uploads/${req.file.filename}` }); }
