export function paging(query) {
  const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 200);
  const skip = Math.max(Number(query.skip) || 0, 0);
  return { limit, skip };
}

export function dateRange(query, field) {
  if (!query.date_from && !query.date_to) return {};
  return { [field]: { ...(query.date_from && { $gte: new Date(query.date_from) }), ...(query.date_to && { $lte: new Date(`${query.date_to}T23:59:59.999Z`) }) } };
}
