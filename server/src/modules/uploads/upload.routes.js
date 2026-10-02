import { Router } from "express";
import { protect } from "../../core/middleware/auth.js";
import { upload } from "../../core/middleware/upload.js";
import { uploadFile } from "./upload.controller.js";
const router = Router(); router.post("/", protect, upload.single("file"), uploadFile); export default router;
