# Technical decisions

Record only decisions that change future framework work: context, decision, consequences, and date.

## 2026-09-18 — Poll the UI CSS source directory during development

- Context: the CSS source is bundled into the legacy stylesheet consumed by demo pages, so Vite alone cannot observe source changes.
- Decision: use a dependency-free 250 ms polling watcher instead of adding a package or filesystem watch handle.
- Consequences: development CSS rebuilds are automatic and work in environments with constrained file-watch limits; the check is limited to the small UI CSS directory.
