import "express-async-errors";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./core/config/env.js";
import apiRoutes from "./routes/index.js";
import { errorHandler, notFound } from "./core/middleware/error.js";
const app = express();
// Render (and most hosts) sit behind a proxy — needed for correct req.ip and rate limiting.
app.set("trust proxy", 1);
// CSP is off because the SPA loads map tiles/marker icons from external CDNs.
app.use(helmet({ crossOriginResourcePolicy: false, contentSecurityPolicy: false }));
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 500, standardHeaders: true, legacyHeaders: false }));
app.use("/uploads", express.static(path.resolve(env.uploadDir)));
app.get("/api/health", (_req, res) => res.json({ status: "ok", app: "Employee ERP System", environment: process.env.NODE_ENV || "development" }));
app.use("/api/v1", apiRoutes);

// In production the built React app (client/dist) is served from this same
// service, so the frontend and API share one origin on Render.
const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../client/dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist, { index: false, setHeaders: (res, filePath) => {
    if (filePath.includes(`${path.sep}assets${path.sep}`)) res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  } }));
  app.get(/^(?!\/api\/|\/uploads\/).*/, (_req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use(notFound); app.use(errorHandler);
export default app;
