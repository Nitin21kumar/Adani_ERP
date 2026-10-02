import AuditTask from "./audit-task.model.js";
import AssetVerification from "./asset-verification.model.js";
import ConditionRating from "./condition-rating.model.js";

export async function dashboardSummary(auditUser) {
  const taskFilter = auditUser.role === "auditor" ? { auditor: auditUser.id } : {};
  const verificationFilter = auditUser.role === "auditor" ? { auditor: auditUser.id } : {};

  const ratings = await ConditionRating.find({ name: { $in: ["Non-functional", "Obsolete / Missing"] } });
  const ratingIdByName = Object.fromEntries(ratings.map((r) => [r.name, r.id]));

  const [totalTasks, completedTasks, pendingVerifications, misApprovedVerifications, conditionAgg, valuationAgg, damageCount, nonFunctionalCount, missingCount] = await Promise.all([
    AuditTask.countDocuments(taskFilter),
    AuditTask.countDocuments({ ...taskFilter, status: "completed" }),
    AssetVerification.countDocuments({ ...verificationFilter, status: "submitted_to_mis" }),
    AssetVerification.countDocuments({ ...verificationFilter, status: "mis_approved" }),
    AssetVerification.aggregate([
      { $match: verificationFilter },
      { $lookup: { from: "conditionratings", localField: "conditionRating", foreignField: "_id", as: "rating" } },
      { $unwind: { path: "$rating", preserveNullAndEmptyArrays: true } },
      { $group: { _id: "$rating.name", count: { $sum: 1 } } }
    ]),
    AssetVerification.aggregate([
      { $match: verificationFilter },
      { $group: { _id: null, totalTentative: { $sum: "$tentativeCost" }, totalActual: { $sum: { $ifNull: ["$actualCost", 0] } } } }
    ]),
    AssetVerification.countDocuments({ ...verificationFilter, "selectedDamageCriteria.0": { $exists: true } }),
    ratingIdByName["Non-functional"] ? AssetVerification.countDocuments({ ...verificationFilter, conditionRating: ratingIdByName["Non-functional"] }) : 0,
    ratingIdByName["Obsolete / Missing"] ? AssetVerification.countDocuments({ ...verificationFilter, conditionRating: ratingIdByName["Obsolete / Missing"] }) : 0
  ]);

  const conditionWiseCount = Object.fromEntries(conditionAgg.map((row) => [row._id || "Unrated", row.count]));

  return {
    total_tasks: totalTasks,
    completed_tasks: completedTasks,
    pending_verifications: pendingVerifications,
    mis_approved_verifications: misApprovedVerifications,
    condition_wise_count: conditionWiseCount,
    total_tentative_valuation: valuationAgg[0]?.totalTentative || 0,
    total_actual_valuation: valuationAgg[0]?.totalActual || 0,
    damaged_assets_count: damageCount,
    non_functional_count: nonFunctionalCount || 0,
    missing_count: missingCount || 0
  };
}
