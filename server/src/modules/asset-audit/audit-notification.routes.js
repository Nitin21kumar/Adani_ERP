import { Router } from "express";
import { auditProtect } from "./audit.middleware.js";
import * as controller from "./audit-notification.controller.js";

const router = Router();
router.use(auditProtect);
router.get("/", controller.list);
router.post("/:id/read", controller.markRead);
router.post("/read-all", controller.markAllRead);
export default router;
