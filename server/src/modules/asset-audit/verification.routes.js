import { Router } from "express";
import { auditAllow, auditProtect } from "./audit.middleware.js";
import { requireFields } from "../../core/middleware/validate.js";
import { handleAuditImages } from "./audit-upload.middleware.js";
import * as controller from "./verification.controller.js";

const router = Router();
router.use(auditProtect);

router.get("/my-verifications", auditAllow("auditor"), controller.mine);
// productId is required unless isOtherProduct is set (free-text product name
// instead) — validated in verification.service.js, not here.
router.post("/verifications", auditAllow("auditor"), requireFields("auditTaskId"), controller.create);
router.get("/verifications", auditAllow("audit_admin", "mis_verifier"), controller.list);
router.get("/verifications/export", auditAllow("audit_admin"), controller.exportCsv);
router.get("/verifications/:id", controller.getOne);
router.patch("/verifications/:id", auditAllow("auditor"), controller.update);
router.post("/verifications/:id/images", auditAllow("auditor"), handleAuditImages, controller.uploadImages);
router.delete("/verifications/:id/images", auditAllow("auditor"), controller.removeImage);
router.post("/verifications/:id/submit", auditAllow("auditor"), controller.submit);

export default router;
