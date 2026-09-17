# Local Demo Pages

This folder contains the minimal local framework demo: a few HTML pages, compatible runtime assets, and quick visual smoke coverage.

## Contents

- `pages/index.html`
  local landing page with access to UI, JSswift core, and the developer view
- `pages/ui.html`
  UI demo with small real examples
- `pages/jsswift.html`
  core demo with `signal`, `computed`, `batch`, and components
- `pages/developers.html`
  narrative page meant to explain the framework to developers
- `pages/tutorial/`
  empty placeholder with no active tutorial content

## Rules

New framework work should not start here when it affects core or UI. The source of truth remains in `packages/core/src` and `packages/ui/src`.

This folder is still useful for:

- quick local demos
- compatibility runtime mirrors
- manual HTML smoke checks
