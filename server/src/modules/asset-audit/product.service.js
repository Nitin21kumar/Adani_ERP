import Product from "./product-master.model.js";
import { ApiError } from "../../core/utils/ApiError.js";
import { paging } from "../../core/utils/query.js";

export async function createProduct(payload) {
  return Product.create({
    productName: payload.productName,
    category: payload.category,
    subCategory: payload.subCategory,
    allowCustomSubProduct: !!payload.allowCustomSubProduct,
    defaultBaseCost: payload.defaultBaseCost,
    active: payload.active !== undefined ? payload.active : true
  });
}

export async function listProducts(query) {
  const filter = {};
  if (query.category) filter.category = query.category;
  if (query.active !== undefined) filter.active = query.active === "true" || query.active === true;
  if (query.search) filter.$text = { $search: query.search };
  const { limit, skip } = paging(query);
  const [items, total] = await Promise.all([
    Product.find(filter).sort({ productName: 1 }).skip(skip).limit(limit),
    Product.countDocuments(filter)
  ]);
  return { items, total, limit, skip };
}

export async function updateProduct(id, payload) {
  const product = await Product.findById(id);
  if (!product) throw new ApiError(404, "Product not found");
  const allowed = ["productName", "category", "subCategory", "allowCustomSubProduct", "defaultBaseCost", "active"];
  allowed.forEach((key) => { if (payload[key] !== undefined) product[key] = payload[key]; });
  await product.save();
  return product;
}
