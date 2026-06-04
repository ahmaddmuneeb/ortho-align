# OrthoAlign API Summary

**Base URL (dev):** `http://localhost:8000` (`PORT=8000` in `ortho-align`)  
**Base URL (prod):** `https://api.orthoalignsolution.com`  
**Docs:** `/api-docs` (Swagger UI)  
**Auth:** `Authorization: Bearer <JWT>` from `POST /api/auth/login` (7-day token)

## System

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/` | — | API metadata |
| GET | `/health` | — | Liveness |
| GET | `/api-docs` | — | Swagger UI |

## Authentication

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/auth/register` | — | CLIENT self-register only |
| POST | `/api/auth/login` | — | Returns `{ token, user }` |

## Dashboard

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/dashboard` | CLIENT | Practice stats |

## Patients

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/patients` | CLIENT, ADMIN | Create patient |
| GET | `/api/patients` | JWT | CLIENT: own; others: all |
| GET | `/api/patients/:id` | JWT | CLIENT: own only |
| PATCH | `/api/patients/:id` | CLIENT, ADMIN | Update patient |

## Cases

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/cases` | CLIENT, ADMIN | New case (`PENDING_PAYMENT`) |
| GET | `/api/cases` | JWT | Filters: `status`, `patientId`; employee: `viewAs=designer\|qc` |
| GET | `/api/cases/:id` | JWT | Role-scoped access |
| PATCH | `/api/cases/:id/notes` | JWT | Owner, assigned employee, or ADMIN |
| POST | `/api/cases/:id/assign` | ADMIN | OPENED → ASSIGNED + designer/QC |
| POST | `/api/cases/:id/transition` | JWT | Workflow transition (role rules in `WorkflowService`) |
| GET | `/api/cases/:id/available-transitions` | JWT | Allowed next statuses for current user |

## Case files

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/cases/:id/files` | CLIENT, ADMIN | Multipart: `category`, `files[]` — SCAN, PHOTO, XRAY, OTHER |
| GET | `/api/cases/:id/files` | JWT | Optional `?category=` |
| DELETE | `/api/cases/:id/files/:fileId` | CLIENT, ADMIN | Removes S3 + DB |

## Prescription

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/cases/:id/prescription` | CLIENT, ADMIN | Create/update JSON body |
| GET | `/api/cases/:id/prescription` | JWT | Assigned employee + owner |
| DELETE | `/api/cases/:id/prescription` | CLIENT, ADMIN | Remove prescription |

## Case submission

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/cases/:id/payment-proof` | CLIENT, ADMIN | Multipart `file` (10MB) |
| POST | `/api/cases/:id/submit` | CLIENT, ADMIN | PENDING_PAYMENT → PENDING_APPROVAL |
| POST | `/api/cases/:id/approve-payment` | ADMIN | PENDING_APPROVAL → IN_DESIGN + assign |

## Production (designer)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/cases/:id/production/files` | EMPLOYEE (DESIGNER, BOTH) | Multipart `files[]` → PRODUCTION category |
| POST | `/api/cases/:id/production/urls` | EMPLOYEE (DESIGNER, BOTH) | JSON `{ url, description? }` |
| GET | `/api/cases/:id/production/urls` | JWT | Role-scoped |
| DELETE | `/api/cases/:id/production/urls/:urlId` | EMPLOYEE (DESIGNER, BOTH) | |

## Comments

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/cases/:id/comments` | JWT | Multipart: `comment`, `isInternal?`, `files[]` |
| GET | `/api/cases/:id/comments` | JWT | Clients do not see `isInternal` |
| DELETE | `/api/cases/:id/comments/:commentId` | JWT | Author or ADMIN |

## Payments

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/payments` | CLIENT, ADMIN | `{ caseId, amount, externalId? }` |
| GET | `/api/payments/case/:caseId` | JWT | Payments for case |
| GET | `/api/payments/:id` | JWT | Single payment |
| POST | `/api/payments/:id/complete` | ADMIN | Mark COMPLETED |
| POST | `/api/payments/:id/fail` | ADMIN | Mark FAILED (`reason?`) |
| POST | `/api/payments/webhook` | — | External gateway (no portal UI) |

## Users

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/users/me` | JWT | Current user profile |
| GET | `/api/users` | ADMIN | List users (`?role`, `?employeeType`) |
| GET | `/api/users/employees` | ADMIN | List employees (`?type=`) |
| GET | `/api/users/:id` | ADMIN | User detail |
| POST | `/api/users/employees` | ADMIN | Create employee |
| PATCH | `/api/users/:id` | ADMIN | Update name, role, employeeType |
| DELETE | `/api/users/:id` | ADMIN | Cannot delete self |

## Employee queue

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/employee/cases` | EMPLOYEE | Assigned cases (`?status`) |
| GET | `/api/employee/cases/:id` | EMPLOYEE | Full case if assigned |

## Designer / QC actions

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/designer/cases/:id/submit-to-qc` | EMPLOYEE (DESIGNER, BOTH) | IN_DESIGN → PENDING_QC |
| POST | `/api/qc/cases/:id/approve` | EMPLOYEE (QC, BOTH) | PENDING_QC → PENDING_CLIENT_REVIEW |
| POST | `/api/qc/cases/:id/reject` | EMPLOYEE (QC, BOTH) | → QC_REJECTED then IN_DESIGN |

## Case status enum

`PENDING_PAYMENT`, `PENDING_APPROVAL`, `OPENED`, `ASSIGNED`, `IN_DESIGN`, `PENDING_QC`, `QC_REJECTED`, `PENDING_CLIENT_REVIEW`, `CLIENT_REJECTED`, `APPROVED`, `CANCELLED`

## File categories

`SCAN`, `PHOTO`, `XRAY`, `PRODUCTION`, `OTHER` (client upload route accepts SCAN, PHOTO, XRAY, OTHER only)
