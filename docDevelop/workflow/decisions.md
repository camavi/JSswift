# Technical decisions

Record only decisions that change future framework work: context, decision, consequences, and date.

## 2026-10-06 — Ship application contracts with their framework release

- Context: a checkout path is not portable to npm users, and documentation bundled only with the MCP could describe a different framework version.
- Decision: ship documents and the versioned map inside `jsswift/dist/documentions`; distribute a standalone MCP executable that resolves public map/manifest exports from the application's package installation. Never silently fall back to checkout documents; development docs require `--docs` and are labeled development.
- Consequences: framework upgrades carry their contracts; MCP upgrades can remain independent. Start the MCP from the target app or pass `--project`. Node resolution covers nested and hoisted installations; distinct monorepo apps use distinct connections. Publication and version selection remain separate authorized release work.

## 2026-10-06 — Prefer direct reactive aliases in app examples

- Context: the core footer already exposes the five reactive primitives directly on the shared application namespace.
- Decision: app-facing guidance uses `_.signal`, `_.effect`, `_.computed`, `_.untracked`, and `_.batch`. Nested reactive references remain valid internally but are not the preferred app spelling.
- Consequences: application discovery and portable Skill snapshots reflect these direct calls; verify exports against source before documenting namespace conventions.

## 2026-10-06 — Use `_` consistently in application contracts

- Context: the runtime shares `window._` with `window.JSswift` and exposes UI functions directly; documentation previously encouraged multiple namespace spellings contrary to the user's intended application API.
- Decision: teach and generate application code with `_.Component` and `_.coreAPI`, including `_.reactive.signal` and `_.http.getJSON`. Normalize internal `UI.Component` signature spellings in application documentation only.
- Consequences: map refresh preserves canonical underscore keywords, map validation rejects noncanonical component signatures or namespace keywords, and the Skill consistently uses `_`. Framework source and maintenance references may retain their internal namespace names.

## 2026-10-06 — Share application discovery between Skill and MCP

- Context: application agents need focused documentation without reading a monolithic API catalog or requiring an application-specific AGENTS.md.
- Decision: keep `documentions` as the contract and use `knowledge-map.json` for topic and component discovery. Skill instructions route to these documents; MCP reads only indexed documentation by ID using the official SDK over stdio. Keep its dependencies isolated from the framework build.
- Consequences: update curated topic keywords when routing changes, refresh component discovery from Markdown metadata, validate map coverage, regenerate portable Skill snapshots, and restart local MCP after documentation updates. Framework-maintenance documents are outside the application index. Initial delivery stays local and private pending a separate distribution request.

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

## 2026-09-18 — Use absolute Vite multi-page inputs

- Context: Vite 8 resolves dependency-scan inputs relative to the configured `pages` root.
- Decision: generate absolute HTML entry paths for the Rollup input map.
- Consequences: production builds and development dependency scanning resolve the same entries.
