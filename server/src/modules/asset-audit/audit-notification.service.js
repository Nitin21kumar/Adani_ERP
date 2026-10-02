import AuditNotification from "./audit-notification.model.js";

export async function notifyNewProductReported(verification, auditor) {
  await AuditNotification.create({
    role: "mis_verifier",
    type: "new_product",
    title: "New product not in Product Master",
    message: `${auditor.name} submitted "${verification.productName}" for review — this product isn't in Product Master yet. Add it so future audits can select it directly.`,
    verification: verification.id
  });
}

export async function listNotifications(role, query) {
  const filter = { role };
  if (query.unreadOnly === "true") filter.read = false;
  const [items, unreadCount] = await Promise.all([
    AuditNotification.find(filter).sort({ createdAt: -1 }).limit(50).populate("verification", "productName status"),
    AuditNotification.countDocuments({ role, read: false })
  ]);
  return { items, unreadCount };
}

export async function markRead(id, role) {
  await AuditNotification.updateOne({ _id: id, role }, { read: true });
}

export async function markAllRead(role) {
  await AuditNotification.updateMany({ role, read: false }, { read: true });
}
