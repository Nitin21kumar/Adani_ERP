import jwt from "jsonwebtoken";
import { env } from "../../core/config/env.js";

// Completely separate signing secret and payload shape from the employee ERP's
// tokens.js — an employee access token can never authenticate an audit route
// and vice versa, even if both happened to share a secret.
export const signAuditAccessToken = (auditUser) => jwt.sign({ sub: auditUser.id, aud: "asset-audit", role: auditUser.role }, env.auditAccessSecret, { expiresIn: env.auditAccessExpiresIn });
export const verifyAuditAccessToken = (token) => jwt.verify(token, env.auditAccessSecret, { audience: "asset-audit" });
