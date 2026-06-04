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

Clients can also self-register at `/register`.

## Route map

| Path | Role | Purpose |
|------|------|---------|
| `/login`, `/register` | Public | Auth |
| `/dashboard` | CLIENT | Stats (`GET /api/dashboard`) |
| `/patients`, `/patients/new`, `/patients/:id` | CLIENT | Patients CRUD |
| `/cases`, `/cases/new`, `/cases/:id` | CLIENT | Cases, files, prescription, payment, submit, client review |
| `/employee/designer`, `/employee/qc` | EMPLOYEE | Queues (`GET /api/employee/cases`) |
| `/employee/cases/:id` | EMPLOYEE | Start design, submit to QC, QC approve/reject, production |
| `/admin` | ADMIN | Dashboard |
| `/admin/users`, `/admin/users/:id`, `/admin/users/new` | ADMIN | Users + create employee |
| `/admin/cases`, `/admin/cases/:id` | ADMIN | Approve payment, assign, payments, files, timeline |

Full API list: [../docs/API_SUMMARY.md](../docs/API_SUMMARY.md)

## Manual test checklist

1. **Client** (`client1@example.com`): dashboard → new patient → new case → upload SCAN/PHOTO → save prescription → record payment + upload proof → submit for approval.
2. **Admin** (`admin@orthoalign.com`): `/admin/cases` → open pending case → confirm payment (if PENDING) → approve payment & pick designer + QC → view prescription/files/timeline.
3. **Designer** (`designer1@orthoalign.com`): queue → open case → start design (if ASSIGNED) → upload production files / add URL → submit to QC.
4. **QC** (`qc1@orthoalign.com`): queue → approve or reject with notes.
5. **Client**: case in `PENDING_CLIENT_REVIEW` → approve or request revision; check production section.
6. **Auth**: reload page while logged in — profile refreshes via `GET /api/users/me`.

## Build

```bash
npm run build
```

Output: `dist/`
