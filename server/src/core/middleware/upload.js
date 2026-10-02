import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { env } from "../config/env.js";
const destination = path.resolve(env.uploadDir);
fs.mkdirSync(destination, { recursive: true });
const storage = multer.diskStorage({ destination: (_req, _file, cb) => cb(null, destination), filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`) });
export const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
