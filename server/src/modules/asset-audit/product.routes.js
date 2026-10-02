import { Router } from "express";
import { auditAllow, auditProtect } from "./audit.middleware.js";
import { requireFields } from "../../core/middleware/validate.js";
import * as controller from "./product.controller.js";

const router = Router();
router.use(auditProtect);
router.get("/", controller.list);
// Product Master is managed by MIS Verifiers, not Audit Admin.
router.post("/", auditAllow("mis_verifier"), requireFields("productName", "category", "defaultBaseCost"), controller.create);
router.patch("/:id", auditAllow("mis_verifier"), controller.update);
export default router;
