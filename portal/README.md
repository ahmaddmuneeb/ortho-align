# OrthoAlign Portal

Vite + React + TypeScript client for the OrthoAlign case management API.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend origin (default in `.env.example`: `http://localhost:8000`) |

Run the API from `../ortho-align` with `PORT=8000` (or match your `.env`).

## Test accounts (local seed)

After `npm run prisma:seed` in `ortho-align`, all seeded users use password **`password123`**:

| Role | Email |
|------|-------|
| Admin | `admin@orthoalign.com` |
| Client | `client1@example.com`, `client2@example.com` |
| Designer | `designer1@orthoalign.com`, `designer2@orthoalign.com` |
| QC | `qc1@orthoalign.com` |
| Designer + QC | `both@orthoalign.com` |
| Patient portal | `patient.john@example.com` (John Smith) |

Clients can also self-register at `/register`. Patient portal accounts are created by an admin (see below).

## Patient portal

| Path | Role | Purpose |
|------|------|---------|
| `/patient/dashboard` | PATIENT | Case status summary |
| `/patient/cases` | PATIENT | Read-only case list (`GET /api/patient/cases`) |
| `/patient/cases/:id` | PATIENT | Status, timeline, files, comments (`GET /api/patient/*`) |
| `/patient/profile` | PATIENT | View/edit display name (`PATCH /api/users/me`) |

Admins create portal access from a case detail page (**Create portal access**) via `POST /api/users/patient-accounts`.

## Route map

| Path | Role | Purpose |
|------|------|---------|
| `/login`, `/register` | Public | Auth (register is doctors only; patients use admin-created accounts) |
| `/dashboard` | CLIENT | Stats (`GET /api/dashboard`) |
| `/patients`, `/patients/new`, `/patients/:id` | CLIENT | Patients CRUD |
| `/cases`, `/cases/new`, `/cases/:id` | CLIENT | Cases, files, prescription, payment, submit, client review |
| `/employee/designer`, `/employee/qc` | EMPLOYEE | Queues (`GET /api/employee/cases`) |
| `/employee/cases/:id` | EMPLOYEE | Start design, submit to QC, QC approve/reject, production |
| `/admin` | ADMIN | Dashboard |
| `/profile` | CLIENT, EMPLOYEE, ADMIN | View/edit own profile (`GET` / `PATCH /api/users/me`) |
| `/admin/patients`, `/admin/patients/new`, `/admin/patients/:id` | ADMIN | Patients list (search by patient or client), create (assign to CLIENT via `createdById`), view/edit, delete (cascades cases) |
| `/admin/users`, `/admin/users/:id`, `/admin/users/new` | ADMIN | Users list (role filter, search), detail/edit, create employee |
| `/admin/cases`, `/admin/cases/new`, `/admin/cases/:id` | ADMIN | List/search cases, create case (any patient), notes, workflow, assign, payments, files |

Full API list: [../docs/API_SUMMARY.md](../docs/API_SUMMARY.md)

## Manual test checklist

1. **Client** (`client1@example.com`): dashboard → new patient → new case → upload SCAN/PHOTO → save prescription → record payment + upload proof → submit for approval.
2. **Admin** (`admin@orthoalign.com`): `/admin/patients` → **Add patient** (select client, fill form) → open patient → edit or delete (confirm; deletes linked cases). `/admin/cases` → **New case** (pick patient) → on detail: save notes, confirm payment, approve payment or assign, workflow transition (e.g. pending payment → opened). Case delete is not supported by the API.
3. **Designer** (`designer1@orthoalign.com`): queue → open case → start design (if ASSIGNED) → upload production files / add URL → submit to QC.
4. **QC** (`qc1@orthoalign.com`): queue → approve or reject with notes.
5. **Client**: case in `PENDING_CLIENT_REVIEW` → approve or request revision; check production section.
6. **Auth**: reload while logged in — Redux bootstraps session via `GET /api/users/me`; sign out calls `POST /api/auth/logout` then clears `orthoalign_token` / `orthoalign_user`.
7. **Profile** (any role): open **Profile** in nav → view fields → **Edit profile** → save → header name updates without re-login.
8. **Admin users**: `/admin/users` → filter by role, search by name/email → open a CLIENT → edit practice fields → save.
9. **Admin patients**: `/admin/patients` → search → **Add patient** → choose client → create → detail → edit → delete (with case cascade warning if cases exist).

### Profile & editable fields

| Role | Self-service (`PATCH /api/users/me`) | Read-only on profile |
|------|--------------------------------------|----------------------|
| CLIENT | name, phone, website, businessAddress | email, role, gender, region, hearAboutUs |
| EMPLOYEE | name | email, role, employeeType |
| ADMIN | name | email, role |
| PATIENT | name | email, role, linked patient record |

Admin can edit any user via `PATCH /api/users/:id` (name, role, employeeType; full client fields when role is CLIENT).

## Auth & session

- **State**: Redux Toolkit (`src/store/slices/authSlice.ts`) — `user`, `token`, `isAuthenticated`, `loading`.
- **Storage**: `localStorage` keys `orthoalign_token` and `orthoalign_user` (synced on every auth change).
- **Login**: `POST /api/auth/login` → dispatch `login` → persist token + user.
- **Logout**: dispatch `logoutAsync` → `POST /api/auth/logout` (Bearer, optional on server) → `clearSession` + redirect to `/login`.
- **401**: `api.ts` dispatches `clearSession` and redirects to `/login` (except on `/login` and `/register`).
- **JWT**: 7-day expiry; client checks `exp` on bootstrap and clears expired tokens.

## Security

### Idle session timeout (20 minutes)

When a user is authenticated (`token` + `user`), `useSessionTimeout` (wired from `AuthBootstrap`) tracks activity via `mousedown`, `keydown`, `touchstart`, `scroll`, and `click` on `window`. After **18 minutes** of inactivity an info toast warns that the session will expire in 2 minutes. After **20 minutes** with no activity the client calls `logoutAsync` (server logout when a token exists), clears Redux and `localStorage`, and redirects to `/login` with a security message. This idle limit is independent of the JWT’s 7-day `exp` — a valid token is still cleared locally if the user is inactive.

### Input sanitization (client)

Form submits run through `src/lib/sanitize.ts` before API calls: trim, strip HTML/script tags, normalize whitespace, and enforce per-field `maxLength`. Passwords are only trimmed (not stripped of special characters). Payment amounts use numeric validation (`parseAmount`), not HTML sanitization. Admin list search boxes sanitize the query string used for client-side filtering (display-safe matching).

The API should still validate and sanitize on the server; client helpers reduce XSS and oversize payloads but are not a substitute for backend checks.

## Build

```bash
npm run build
```

Output: `dist/`
