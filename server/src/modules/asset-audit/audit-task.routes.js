import { Router } from "express";
import { auditAllow, auditProtect } from "./audit.middleware.js";
import { requireFields } from "../../core/middleware/validate.js";
import * as controller from "./audit-task.controller.js";

const router = Router();
router.use(auditProtect);
router.get("/my-tasks", auditAllow("auditor"), controller.mine);
router.patch("/my-tasks/:id/complete", auditAllow("auditor"), controller.complete);
router.post("/tasks", auditAllow("audit_admin"), requireFields("auditor"), controller.create);
router.get("/tasks", auditAllow("audit_admin"), controller.list);
router.patch("/tasks/:id", auditAllow("audit_admin"), controller.update);
export default router;
