import { Router } from "express";
import { allow, managementRoles, protect } from "../../core/middleware/auth.js";
import { requireFields } from "../../core/middleware/validate.js";
import * as controller from "./department.controller.js";
const router = Router(); router.use(protect); router.get("/", controller.list); router.post("/", allow(...managementRoles), requireFields("name"), controller.create); router.put("/:id", allow(...managementRoles), controller.update); router.delete("/:id", allow("super_admin", "admin"), controller.remove); export default router;
