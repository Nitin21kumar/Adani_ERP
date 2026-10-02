import "dotenv/config";
import { connectDatabase } from "../core/config/db.js";
import Role from "../modules/auth/role.model.js";
import User from "../modules/auth/user.model.js";
import Employee from "../modules/employees/employee.model.js";
const roles = ["super_admin", "admin", "hr", "manager", "employee"];
await connectDatabase();
for (const name of roles) await Role.updateOne({ name }, { $setOnInsert: { name } }, { upsert: true });
const adminRole = await Role.findOne({ name: "super_admin" });
const email = process.env.SEED_ADMIN_EMAIL || "admin@company.com";
let admin = await User.findOne({ email });
if (!admin) {
  admin = await User.create({ email, password: process.env.SEED_ADMIN_PASSWORD || "Admin@12345", role: adminRole.id, status: "active" });
  await Employee.create({ user: admin.id, employee_code: "ADM0001", full_name: "System Administrator", designation: "Super Admin" });
  console.log(`Created administrator: ${email}`);
} else console.log(`Administrator already exists: ${email}`);
process.exit(0);
