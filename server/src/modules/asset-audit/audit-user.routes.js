import { Router } from "express";
import { auditAllow, auditProtect } from "./audit.middleware.js";
import { requireFields } from "../../core/middleware/validate.js";
import * as controller from "./audit-user.controller.js";

const router = Router();
router.use(auditProtect, auditAllow("audit_admin"));
router.post("/", requireFields("name", "email", "password", "role"), controller.create);
router.get("/", controller.list);
router.patch("/:id", controller.update);
export default router;
