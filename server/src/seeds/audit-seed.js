import "dotenv/config";
import { connectDatabase } from "../core/config/db.js";
import ConditionRating from "../modules/asset-audit/condition-rating.model.js";
import AuditUser from "../modules/asset-audit/audit-user.model.js";

const defaultConditionRatings = [
  { name: "Very Good", valuationPercentage: 65 },
  { name: "Good", valuationPercentage: 45 },
  { name: "Satisfactory", valuationPercentage: 35 },
  { name: "Repairable", valuationPercentage: 25 },
  { name: "Poor", valuationPercentage: 17.5 },
  { name: "Non-functional", valuationPercentage: 10 },
  { name: "Obsolete / Missing", valuationPercentage: 0 }
];

await connectDatabase();

for (const rating of defaultConditionRatings) {
  await ConditionRating.updateOne({ name: rating.name }, { $setOnInsert: rating }, { upsert: true });
}
console.log(`Seeded ${defaultConditionRatings.length} condition ratings.`);

const email = process.env.SEED_AUDIT_ADMIN_EMAIL || "auditadmin@company.com";
let admin = await AuditUser.findOne({ email });
if (!admin) {
  admin = await AuditUser.create({ name: "Audit Administrator", email, password: process.env.SEED_AUDIT_ADMIN_PASSWORD || "Audit@12345", role: "audit_admin", status: "active" });
  console.log(`Created audit administrator: ${email}`);
} else console.log(`Audit administrator already exists: ${email}`);

process.exit(0);
