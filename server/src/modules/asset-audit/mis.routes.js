import { Router } from "express";
import { auditAllow, auditProtect } from "./audit.middleware.js";
import * as controller from "./mis.controller.js";

const router = Router();
router.use(auditProtect, auditAllow("mis_verifier", "audit_admin"));
router.get("/pending-verifications", controller.pending);
router.get("/verifications/:id", controller.getOne);
router.post("/verifications/:id/approve", controller.approve);
router.post("/verifications/:id/return", controller.returnToAuditor);
export default router;
