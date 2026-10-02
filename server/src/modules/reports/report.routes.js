import { Router } from "express";
import { allow, managementRoles, protect } from "../../core/middleware/auth.js";
import * as controller from "./report.controller.js";
const router = Router(); router.use(protect); router.get("/dashboard-summary", controller.summary); router.get("/:type", allow(...managementRoles, "manager"), controller.getReport); export default router;
