import CompanySettings from "./company-settings.model.js";
import Holiday from "./holiday.model.js";
export async function company() { let record = await CompanySettings.findOne(); if (!record) record = await CompanySettings.create({}); return record; }
export async function updateCompany(payload) { const record = await company(); Object.assign(record, payload); return record.save(); }
export const holidays = (year) => { const filter = {}; if (year) filter.date = { $gte: new Date(`${year}-01-01`), $lt: new Date(`${Number(year) + 1}-01-01`) }; return Holiday.find(filter).sort({ date: 1 }); };
export const addHoliday = (payload) => Holiday.create(payload);
export const removeHoliday = (id) => Holiday.findByIdAndDelete(id);
