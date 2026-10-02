import { Router } from "express";
import { auditProtect } from "./audit.middleware.js";
import { requireFields } from "../../core/middleware/validate.js";
import * as controller from "./audit-auth.controller.js";

const router = Router();
router.post("/login", requireFields("email", "password"), controller.login);
router.get("/me", auditProtect, controller.me);
export default router;
