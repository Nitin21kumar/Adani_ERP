import { Router } from "express";
import { allow, managementRoles, protect } from "../../core/middleware/auth.js";
import { requireFields } from "../../core/middleware/validate.js";
import * as controller from "./daily-report.controller.js";
const router = Router(); router.use(protect); router.post("/", requireFields("title", "task_description"), controller.submit); router.get("/me/today", controller.today); router.get("/me", controller.mine); router.get("/", allow(...managementRoles, "manager"), controller.list); router.put("/:id", controller.update); router.post("/:id/comment", allow(...managementRoles, "manager"), requireFields("comment"), controller.comment); export default router;
