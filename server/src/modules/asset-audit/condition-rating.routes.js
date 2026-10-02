import { Router } from "express";
import { auditAllow, auditProtect } from "./audit.middleware.js";
import { requireFields } from "../../core/middleware/validate.js";
import * as controller from "./condition-rating.controller.js";

const router = Router();
router.use(auditProtect);
router.get("/", controller.list);
router.post("/", auditAllow("audit_admin"), requireFields("name", "valuationPercentage"), controller.create);
router.patch("/:id", auditAllow("audit_admin"), controller.update);
export default router;
