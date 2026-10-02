import { Router } from "express";
import { protect } from "../../core/middleware/auth.js";
import * as controller from "./notification.controller.js";
const router = Router(); router.use(protect); router.get("/me", controller.mine); router.post("/read-all", controller.readAll); router.post("/:id/read", controller.read); export default router;
