# Development changelog

Record significant completed framework work: date, outcome, affected areas, and verification.

## 2026-09-18 — UI CSS development watcher

- Outcome: `npm run dev` now starts Vite and a watcher that rebuilds UI CSS from source.
- Areas: root npm scripts, `tools/dev.mjs`, and `tools/watch-ui-css.mjs`.
- Verification: syntax checks passed; modifying `packages/ui/src/css/ui-components.css` triggered a regenerated UI CSS bundle.

## 2026-09-18 — Vite 8 upgrade

- Outcome: upgraded Vite from 7.3.2 to 8.3.0.
- Areas: root package manifest and lockfile.
- Verification: `npm run build`, `npm test` (55 passing), and `npm run test:browser` (10 passing).
