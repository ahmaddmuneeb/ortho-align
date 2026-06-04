# OrthoAlign Portal — Frontend Implementation Plan

**Backend sync ✅** — Portal audited against workspace `ortho-align` routes (Jun 2026). See [docs/API_SUMMARY.md](API_SUMMARY.md) for the full endpoint list.

Eight chunks from MVP scaffold to full production portal.

## Chunk 1 — Scaffold & auth (MVP) ✅

- Vite + React + TypeScript + Tailwind v4 + react-router-dom
- `VITE_API_BASE_URL`, `src/lib/api.ts` (Bearer JWT, typed `ApiError`, multipart `api.upload`)
- Auth context (localStorage token + user)
- Login, CLIENT self-registration (backend fields)
- Role redirect: CLIENT → dashboard; ADMIN → admin; EMPLOYEE → designer/QC queue by `employeeType`

## Chunk 2 — Client shell & read-only lists ✅

- Protected layout: Dashboard, Patients, Cases nav
- `GET /api/dashboard` stats cards + status breakdown
- `GET /api/patients` and `GET /api/cases` lists

## Chunk 3 — Patient CRUD ✅

- `src/types/patient.ts` aligned with backend
- Patients list: table (md+), cards (mobile), loading skeleton, empty state, **Add patient**
- `POST /api/patients` → `/patients/new`; detail + edit at `/patients/:id` (`GET`, `PATCH`)
- Shared `PatientForm` with inline + API error display

## Chunk 4 — Case creation & detail ✅

- Cases list with status filters, links to `/cases/:id`
- New case: `/cases/new` → `POST /api/cases` (patient + notes)
- Case detail: status badge, patient info, notes `PATCH /api/cases/:id/notes`
- Case files: upload/list/delete via `/api/cases/:id/files` (multipart)
- Prescription: `POST`/`GET`/`DELETE` `/api/cases/:id/prescription` with `PrescriptionForm`

## Chunk 5 — Case workflow (client) ✅

- Submission: payment proof upload + `POST /api/cases/:id/submit`
- Client review: `GET available-transitions`, `POST /api/cases/:id/transition` (approve/reject)
- Comments thread with attachments (`/api/cases/:id/comments`)
- Production URLs display for client (`GET /api/cases/:id/production/urls`)

## Chunk 6 — Payments (PAYG) ✅

- `POST /api/payments`, `GET /api/payments/case/:caseId`
- Payment proof on case (`POST /api/cases/:id/payment-proof`)
- `PENDING_PAYMENT` banner and submit flow on case detail

## Chunk 7 — Employee portals ✅

- EMPLOYEE home by role: `/employee/designer`, `/employee/qc`, BOTH sees both nav items
- Queue: `GET /api/employee/cases` with status filter
- Case detail: `GET /api/employee/cases/:id`
- Designer: `POST /api/designer/cases/:id/submit-to-qc`, production files/URLs
- QC: `POST /api/qc/cases/:id/approve` and `/reject`
- Internal comments on employee detail

## Chunk 8 — Admin (minimal viable) ✅

- Admin dashboard `/admin`, users `/admin/users`, create employee `/admin/users/new`
- Cases list `/admin/cases`, detail with assign + approve-payment
- Role-based `PortalLayout` nav (client / employee / admin)

## Polish ✅

- **Admin users**: `/admin/users/:id` — `PATCH` / `DELETE` on user detail (name, role, employee type)
- **UX**: Sonner toasts; root `ErrorBoundary`; loading/empty on admin users and case lists
- **Production deliverables**: Dedicated section on client, employee, and admin case detail — PRODUCTION files + URLs, teal styling, human-readable category labels; clinical files exclude PRODUCTION
- **Payments**: PAYG checklist, proof upload status, payment status labels, toasts on record/upload
- **Docs**: `portal/README.md` (env, seed accounts, routes, manual QA); root README links

## Backend sync additions (post-audit)

- `GET /api/users/me` on app load (refresh profile / clear stale token)
- Admin: payment confirm/fail (`POST /api/payments/:id/complete|fail`), prescription view, comments, file upload, workflow timeline
- Designer: `ASSIGNED` → `IN_DESIGN` via `POST /api/cases/:id/transition`
- Comment delete (author or ADMIN)
- Prescription: procline, molar/posterior goals, midline shift mm when shifted
- Prescription tooth notation ✅ — universal 1–32 arrays (`avoidEngagersTeeth`, `extractTeeth`, `leaveSpacesTeeth`, `doNotMoveTeeth`); optional canine/molar relationship strings

## Remaining gaps (intentional or backend-limited)
- `GET /api/payments/:id` — no dedicated screen (list by case is enough)
- Payment webhook UI (server-only `POST /api/payments/webhook`)
- Swagger `/api-docs`, `/`, `/health` — not embedded in portal
- E2E test suite (manual checklist in `portal/README.md` instead)

## Blocked on mockups only

- Pixel-perfect Figma parity — export PNGs to `docs/mockups/` per [docs/MOCKUPS.md](docs/MOCKUPS.md) (folder empty; portal uses teal theme + functional layout until assets land)
