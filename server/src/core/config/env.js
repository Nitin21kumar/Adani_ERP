import "dotenv/config";

const required = ["MONGODB_URI", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"];
if (process.env.NODE_ENV === "production") {
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
}

export const env = {
  port: Number(process.env.PORT || 8000),
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/employee_erp",
  accessSecret: process.env.JWT_ACCESS_SECRET || "development-access-secret-change-me",
  refreshSecret: process.env.JWT_REFRESH_SECRET || "development-refresh-secret-change-me",
  accessExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "30m",
  refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  uploadDir: process.env.UPLOAD_DIR || "uploads",
  auditAccessSecret: process.env.AUDIT_JWT_ACCESS_SECRET || "development-audit-access-secret-change-me",
  auditAccessExpiresIn: process.env.AUDIT_ACCESS_TOKEN_EXPIRES_IN || "12h"
};
