import { Router } from "express";
import { allow, managementRoles, protect } from "../../core/middleware/auth.js";
import { requireFields } from "../../core/middleware/validate.js";
import * as controller from "./employee.controller.js";
const router = Router(); router.use(protect);
router.route("/").get(allow(...managementRoles, "manager"), controller.list).post(allow(...managementRoles), requireFields("email", "employee_code", "full_name"), controller.create);
router.route("/:id").get(allow(...managementRoles, "manager"), controller.getOne).put(allow(...managementRoles), controller.update).delete(allow("super_admin", "admin"), controller.remove);
router.post("/:id/block", allow(...managementRoles), controller.block); router.post("/:id/activate", allow(...managementRoles), controller.activate);
export default router;
