import { asyncHandler } from "../../core/utils/asyncHandler.js";
import * as service from "./verification.service.js";

export const create = asyncHandler(async (req, res) => res.status(201).json(await service.createVerification(req.auditUser, req.body)));
export const update = asyncHandler(async (req, res) => res.json(await service.updateVerification(req.params.id, req.auditUser, req.body)));
export const submit = asyncHandler(async (req, res) => res.json(await service.submitVerification(req.params.id, req.auditUser)));
export const uploadImages = asyncHandler(async (req, res) => {
  const { latitude, longitude } = req.body;
  const location = latitude !== undefined && longitude !== undefined && latitude !== "" && longitude !== "" && Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))
    ? { latitude: Number(latitude), longitude: Number(longitude) }
    : undefined;
  res.status(201).json(await service.addImages(req.params.id, req.auditUser, req.files, location));
});
export const removeImage = asyncHandler(async (req, res) => res.json(await service.deleteImage(req.params.id, req.body.imageUrl, req.auditUser)));
export const getOne = asyncHandler(async (req, res) => res.json(await service.getVerification(req.params.id, req.auditUser)));
export const mine = asyncHandler(async (req, res) => res.json(await service.myVerifications(req.auditUser, req.query)));
export const list = asyncHandler(async (req, res) => res.json(await service.listVerifications(req.query)));
export const exportCsv = asyncHandler(async (req, res) => {
  const csv = await service.exportApprovedCsv();
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="mis_approved_verifications_${Date.now()}.csv"`);
  res.send(csv);
});
