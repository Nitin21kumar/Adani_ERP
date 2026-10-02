export function notFound(req, _res, next) { const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`); error.statusCode = 404; next(error); }
export function errorHandler(error, _req, res, _next) {
  if (error.name === "ValidationError") return res.status(400).json({ detail: error.message });
  if (error.code === 11000) return res.status(409).json({ detail: `Duplicate value for ${Object.keys(error.keyPattern).join(", ")}` });
  if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") return res.status(401).json({ detail: "Invalid or expired token" });
  console.error(error);
  res.status(error.statusCode || 500).json({ detail: error.message || "Internal server error" });
}
