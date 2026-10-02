import { Router } from "express";
import { allow, managementRoles, protect } from "../../core/middleware/auth.js";
import { requireFields } from "../../core/middleware/validate.js";
import * as controller from "./wfh.controller.js";
const router = Router(); router.use(protect); router.post("/", requireFields("reason", "expected_work", "from_date", "to_date"), controller.apply); router.get("/me", controller.mine); router.get("/", allow(...managementRoles, "manager"), controller.list); router.post("/:id/approve", allow(...managementRoles, "manager"), controller.approve); router.post("/:id/reject", allow(...managementRoles, "manager"), controller.reject); export default router;
