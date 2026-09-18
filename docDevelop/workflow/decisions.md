# Technical decisions

Record only decisions that change future framework work: context, decision, consequences, and date.

## 2026-09-18 — Poll the UI CSS source directory during development

- Context: the CSS source is bundled into the legacy stylesheet consumed by demo pages, so Vite alone cannot observe source changes.
- Decision: use a dependency-free 250 ms polling watcher instead of adding a package or filesystem watch handle.
- Consequences: development CSS rebuilds are automatic and work in environments with constrained file-watch limits; the check is limited to the small UI CSS directory.

## 2026-09-18 — Adopt Vite 8.3.0

- Context: the project used Vite 7.3.2 while Vite 8.3.0 was the latest available release.
- Decision: upgrade the development and production build toolchain to Vite 8.3.0.
- Consequences: the project receives the current Vite release; compatibility is covered by the full build and test suite.

## 2026-09-18 — Apply compatible npm audit remediations

- Context: Vite's updated dependency tree exposed low and moderate advisories in transitive Express dependencies.
- Decision: apply the `npm audit fix` remediation without `--force`.
- Consequences: `body-parser` and `qs` are patched without a direct dependency or API change.
