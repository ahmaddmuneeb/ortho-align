# Design mockups

## Portal.pdf

`Portal.pdf` in the repo root is a Figma export (~242MB, single image-heavy page). **Do not load it into agent context or CI** — it exceeds size limits and provides little searchable text.

Prior review of page 1 text (OCR/extract) indicates:

- **Product:** OrthoAlign Solution
- **Plan:** PAYG (pay-as-you-go)
- **Flow:** Sign-Up from website → registration onboarding for doctors (CLIENT)

## Recommended workflow

1. In Figma, export each screen/frame as **PNG** (or WebP), target **&lt;2MB** per file.
2. Save under `docs/mockups/` with clear names, e.g.:
   - `01-login.png`
   - `02-register-step1.png`
   - `03-dashboard.png`
3. Reference filenames in `docs/FRONTEND_PLAN.md` chunk 8 when matching UI.

## Interim branding (implemented)

Until frame exports exist, the portal uses a clean medical UI with **teal** accents (`brand-600` ≈ `#0d9488`), white cards, and slate neutrals — aligned with typical dental SaaS patterns.
