# Employee ERP System — MERN

This is a MERN conversion of the Employee ERP system. The original FastAPI, SQLAlchemy, Alembic, PostgreSQL, and Redis backend has been replaced by Express, MongoDB, Mongoose, JWT authentication, and modular MVC feature folders. The React 19, TypeScript, Vite, and Tailwind CSS client has been retained.

## Architecture

```text
server/src/
├── core/
│   ├── config/
│   ├── middleware/
│   ├── utils/
│   └── integrations/
├── modules/
│   ├── auth/
│   ├── employees/
│   ├── attendance/
│   ├── leave/
│   ├── work-from-home/
│   ├── daily-reports/
│   ├── departments/
│   ├── notifications/
│   ├── profile/
│   ├── settings/
│   ├── reports/
│   └── uploads/
├── routes/
├── seeds/
├── app.js
└── server.js
```

Each module owns its model, service, controller, and routes. New business capabilities should be added as a module, then mounted once in `server/src/routes/index.js`. External providers belong in `core/integrations`, keeping feature logic independent from individual email, storage, SMS, or payment providers.

## Start locally

1. Copy `server/.env.example` to `server/.env` and replace all development secrets.
2. Start MongoDB locally, or set `MONGODB_URI` to MongoDB Atlas.
3. Run `npm install` in `server/`, then `npm run seed` and `npm run dev`.
4. Run `npm install` in `client/`, then `npm run dev`.
5. Open `http://localhost:5173` and sign in using the seeded administrator account.

The initial account is `admin@company.com` / `Admin@12345`. Change that password before any non-local deployment.

## Docker

```bash
docker compose up
```

This starts MongoDB, the Express API on port 8000, and the Tailwind/Vite React client on port 5173.

## Deploy on Render

`render.yaml` deploys everything as **one Render Web Service**: the Express API (`/api/v1`) also serves the built React app, so the ERP (`/login`) and the Audit portal (`/audit/login`) run on the same URL.

1. Create a MongoDB Atlas cluster (Render doesn't host MongoDB). Under Network Access allow `0.0.0.0/0`, and copy the connection string, e.g. `mongodb+srv://user:pass@cluster.mongodb.net/employee_erp`.
2. Push this folder (the one containing `render.yaml`) to a GitHub repository.
3. In Render: **New → Blueprint**, pick the repository. Render reads `render.yaml` and asks for:
   - `MONGODB_URI` — the Atlas connection string
   - `CLIENT_URL` — the service URL, e.g. `https://adani-power-erp.onrender.com`
   - `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — first ERP super admin
   - `SEED_AUDIT_ADMIN_EMAIL` / `SEED_AUDIT_ADMIN_PASSWORD` — first Audit admin
   JWT secrets are generated automatically.
4. Deploy. Every start runs the (idempotent) seeds, then starts the server.

The blueprint uses Render's **free plan**: the service sleeps after 15 minutes without traffic (the first request afterwards takes ~1 minute), and there is no persistent disk, so uploaded files (photos, logos) are lost on every restart/redeploy. For permanent uploads, switch to a paid plan and add a Render Disk with `UPLOAD_DIR` pointing into it.

## API

All resource routes are served under `/api/v1`. The React client is configured for `http://localhost:8000/api/v1` and uses the existing Tailwind design system.

## Asset Audit & Verification Portal

A second, fully independent portal lives in the same codebase and MongoDB database as the Employee ERP above. It has its own collections, JWT auth, middleware, routes, layouts, and sidebar — it does not read, modify, or depend on the Employee/User/Attendance/Leave/WFH modules, and the Employee ERP is unaffected by it (see `server/src/modules/asset-audit/` and `client/src/pages/audit/`).

### Install & run

No separate install step — it's part of the same `server`/`client` apps. After the normal setup above:

```bash
npm run seed:audit --prefix server
```

This seeds the 7 default Condition Ratings and one Audit Admin account: `auditadmin@company.com` / `Audit@12345` (override via `SEED_AUDIT_ADMIN_EMAIL` / `SEED_AUDIT_ADMIN_PASSWORD`). Change that password before any non-local deployment. Sign in at `http://localhost:5173/audit/login`, then create Auditor and MIS Verifier accounts from **Audit Admin → Auditor & MIS Users**.

In production, also set `AUDIT_JWT_ACCESS_SECRET` (separate from `JWT_ACCESS_SECRET`) in `server/.env` — audit sessions are signed with their own secret and carry their own token, entirely separate from Employee ERP sessions, so the two can be open in the same browser at once without conflict.

### Roles

| Role | Description |
| --- | --- |
| `audit_admin` | Manages Auditor/MIS accounts, Damage Criteria, Condition Ratings, and audit task assignment. Views the dashboard and exports MIS-approved records as CSV. Does **not** manage Product Master — that's MIS's responsibility. |
| `auditor` | Sees only their assigned tasks, fills out the asset verification form (product, damage, condition, photos, remarks), and submits to MIS. Cannot set actual cost. One task can hold several asset verifications (a task is one location/site visit, not one asset), and the auditor explicitly marks a task complete when done there. |
| `mis_verifier` | Manages Product Master (add/edit products and default base costs). Reviews verifications submitted by auditors, approves (optionally adjusting actual cost) or returns them for correction with mandatory remarks. |

### Routes

Frontend: `/audit/login`, `/audit/admin/{dashboard,users,damage-criteria,condition-ratings,tasks}`, `/audit/auditor/{dashboard,verify,history}`, `/audit/mis/{dashboard,pending,verification/:id,products}`.

Backend, all under `/api/v1/audit`: `auth/{login,me}`, `users`, `products` (write access: `mis_verifier`), `damage-criteria`, `condition-ratings`, `tasks`, `my-tasks` (+ `/:id/complete`), `my-verifications`, `verifications` (+ `/:id`, `/:id/images`, `/:id/submit`, `/export`), `mis/{pending-verifications,verifications/:id,verifications/:id/approve,verifications/:id/return}`, `dashboard/summary`, `notifications` (+ `/:id/read`, `/read-all`).

### Workflow

1. **Audit Admin** creates Auditor/MIS accounts, Damage Criteria, and tunes Condition Rating valuation percentages (defaults: Very Good 65%, Good 45%, Satisfactory 35%, Repairable 25%, Poor 17.5%, Non-functional 10%, Obsolete/Missing 0%). Tasks — each representing one location/site visit — are created and assigned to a single auditor.
2. **Auditor** opens an assigned task and, for each asset found there, picks a product from Product Master (the draft is created automatically the moment a product is picked, so the camera/gallery buttons are available immediately — no separate "save" step first) — or, if it isn't listed yet, selects **"Other / Not Listed…"** and types the name instead, so the audit never has to wait on Product Master being updated first (the draft auto-creates once both the name and a base cost are entered, since there's no default to draw from). They optionally select damage criteria and a custom sub-product name, set a condition rating (tentative cost = base cost × valuation % is computed automatically), attach up to 10 photos (JPEG/PNG/WEBP/GIF, 5MB each — "Take Photo" also captures the device's current GPS location, best-effort), and add remarks (mandatory for Poor/Non-functional/Obsolete-Missing conditions or whenever damage criteria are selected). They can save further edits as a draft, submit an asset to MIS once its product, condition rating, base cost, and at least one photo are present (submitting also saves any edit still pending in the form), add another asset under the same task via "Add Another Asset", and mark the whole task complete once every asset at that location has been logged (this locks all assets under the task, including any left in draft).
3. **MIS Verifier** manages Product Master, then reviews submitted verifications — product, condition, damage criteria, all photos (with a "View capture location" link on ones taken with the camera), remarks, base cost, and tentative cost — and either approves (accepting the tentative cost or entering an adjusted actual cost) or returns the verification to the auditor with mandatory remarks. Approval requires at least one photo. An approved verification locks for further auditor edits. When an auditor submits an "Other / Not Listed" asset, MIS gets an in-app notification (bell icon, polled every 30s) linking straight to that verification, with a banner prompting them to add the product to Product Master.

Photo location capture is best-effort and non-blocking (a denied/unavailable permission never stops the upload, it's just omitted), stored per-photo on `VerificationImage.location`, matching the Employee ERP's existing graceful-degradation pattern for geolocation.
