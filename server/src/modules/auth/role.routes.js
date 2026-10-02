import { Router } from "express";
import { protect } from "../../core/middleware/auth.js";
import { list } from "./role.controller.js";
const router = Router(); router.get("/", protect, list); export default router;
