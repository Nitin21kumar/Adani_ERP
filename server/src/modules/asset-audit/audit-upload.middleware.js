import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { env } from "../../core/config/env.js";
import { ApiError } from "../../core/utils/ApiError.js";

// Own subfolder under the shared uploads dir — still served by the existing
// app.use("/uploads", express.static(...)) in app.js, no server.js/app.js
// changes needed, and nothing here touches core/middleware/upload.js.
const destination = path.resolve(env.uploadDir, "asset-audit");
fs.mkdirSync(destination, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, destination),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`)
});

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const MAX_IMAGES_PER_VERIFICATION = 10;

const fileFilter = (_req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) return cb(new Error("Only JPEG, PNG, WEBP, or GIF images are allowed"));
  cb(null, true);
};

export const auditImageUpload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024, files: MAX_IMAGES_PER_VERIFICATION } });

// Multer reports bad files/oversize/too-many via next(err) before any route
// handler runs, so a plain .array(...) middleware would surface as a raw 500.
// Translate it into the same ApiError shape the rest of the API uses.
export const handleAuditImages = (req, res, next) => auditImageUpload.array("images", MAX_IMAGES_PER_VERIFICATION)(req, res, (err) => {
  if (err) return next(new ApiError(400, err.message || "Failed to upload images"));
  next();
});
