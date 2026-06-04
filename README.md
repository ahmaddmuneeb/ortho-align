# OrthoAlign Portal (Frontend)

Doctor and staff portal for [OrthoAlign Solution](https://api.orthoalignsolution.com/). Backend API lives in [`ortho-align/`](ortho-align/) (clone of [amir-2039/ortho-align](https://github.com/amir-2039/ortho-align)).

## Quick start

```bash
cd portal
cp .env.example .env   # set VITE_API_BASE_URL for local API if needed
npm install
npm run dev
```

Open http://localhost:5173 — register a CLIENT account or sign in with seeded credentials (see [portal/README.md](portal/README.md)).

## Build

```bash
cd portal
npm run build
```

Output: `portal/dist/`

## Project layout

| Path | Purpose |
|------|---------|
| `portal/` | Vite + React + TypeScript + Tailwind v4 SPA |
| `ortho-align/` | Express + Prisma API (local dev) |
| `docs/` | API summary, frontend plan, mockup notes |

## Docs

- [portal/README.md](portal/README.md) — env, test accounts, route map, manual QA checklist
- [docs/FRONTEND_PLAN.md](docs/FRONTEND_PLAN.md) — phased implementation
- [docs/API_SUMMARY.md](docs/API_SUMMARY.md) — endpoint reference
- [docs/MOCKUPS.md](docs/MOCKUPS.md) — design assets guidance
