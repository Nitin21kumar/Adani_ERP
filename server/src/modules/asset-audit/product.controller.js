import { asyncHandler } from "../../core/utils/asyncHandler.js";
import * as service from "./product.service.js";

export const create = asyncHandler(async (req, res) => res.status(201).json(await service.createProduct(req.body)));
export const list = asyncHandler(async (req, res) => res.json(await service.listProducts(req.query)));
export const update = asyncHandler(async (req, res) => res.json(await service.updateProduct(req.params.id, req.body)));
