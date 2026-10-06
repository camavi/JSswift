# Development changelog

Record significant completed framework work: date, outcome, affected areas, and verification.

## 2026-10-06 — JSswift 1.0.44 and knowledge MCP 0.1.0 release

- Outcome: prepared versioned framework documentation, standalone MCP distribution, and user-facing release setup. npm accepted publication of `@jsswift/core`, `@jsswift/ui`, and `jsswift` 1.0.44 plus `@jsswift/knowledge-mcp` 0.1.0 with public access and latest tags.
- Verification: runtime/production/MCP builds; 58 project tests; 10 browser tests; discovery and both source/packed MCP integrations; inspected all four tarballs; rebuilt portable Skill; whitespace checks.
- Registry verification: all four versions are visible on npm; jsswift/latest is 1.0.44 and knowledge-mcp/latest is 0.1.0. Installed framework and MCP from the public registry in a temporary app and verified version 1.0.44, _.Button discovery, and _.signal documentation over stdio.

## 2026-10-06 — Standard application button name

- Outcome: application examples, component signatures, discovery names, Skill and MCP instructions prefer `_.Button`. `_.Btn` remains an alias, and the `component:btn` ID and `components/btn.md` path remain stable.
- Verification: runtime availability and Button discovery tests pass; source and packed MCP integration pass; framework/MCP builds and portable Skill regenerated. Reactivity conventions were not changed.

## 2026-10-06 — Versioned framework documentation and standalone MCP distribution

- Outcome: `build:jsswift` includes application documentation with a version-stamped Knowledge Map; package exports expose map and manifest without importing browser code. The separate MCP has a bundled executable and resolves the installed application package from cwd or `--project`, with explicit `--docs` development mode.
- Areas: framework package manifest/build, MCP package manifest/lockfile/build/readme, project resolver, Skill routing, setup/release guides, and tarball integration tests.
- Verification: 58 project tests pass; knowledge checks and source stdio integration pass; both npm tarballs are extracted into a temporary app and the standalone server reads its installed documentation, reports its version, resolves ancestor node_modules, and rejects missing documents/version mismatches. Portable Skill rebuilt and validated; diff check passes.
- Release status: no publication or client configuration performed. MCP stays private; a new framework release is required before existing npm consumers receive the documents. One app per MCP connection; no automatic multi-app discovery.

## 2026-10-06 — Direct reactive aliases for application code

- Outcome: application guides, function catalog, discovery keywords, Skill, and AGENTS.md now teach `_.signal`, `_.effect`, `_.computed`, `_.untracked`, and `_.batch`, as exposed by `packages/core/src/53-footer.js`.
- Verification: core aliases match the reactive implementations; after UI initialization direct signal/effect usage updates reactive state correctly; knowledge and MCP tests pass; portable Skill rebuilt and validated.

## 2026-10-06 — Canonical `_` API in application documentation

- Outcome: application examples, all 58 component signatures, method references, the function catalog, discovery keywords, and Skill now use the shared `_` namespace directly. Updated AGENTS.md to match the user's application convention.
- Areas: `documentions`, Skill, knowledge generator and validation, and discovery/MCP tests. Runtime source and internal metadata were not changed.
- Verification: all 58 documented component functions are available directly on `_` in the loaded runtime; discovery and stdio MCP tests pass with `_.Input` and `_.Toggle`; map regenerated; portable Skill rebuilt and validated; diff whitespace check passes.

## 2026-10-06 — Application knowledge map, Skill, and local MCP

- Outcome: application AI discovery shares one map covering 10 topics and all 58 documented component contracts. Added a portable Skill builder and read-only stdio MCP with search, document reads, and resources.
- Areas: `documentions/knowledge-map.json`, application setup guide and index, `ai/`, knowledge tools, isolated MCP package and lockfile, and discovery/integration tests.
- Verification: map validation; source and portable Skill validation; portable contract coverage; 57 passing project tests; MCP stdio integration from another working directory; rejected traversal and escaping symlinks; `git diff --check`; MCP production dependency audit reports zero vulnerabilities.
- Distribution: repository-local MCP and generated portable Skill; no npm publication or client configuration performed.

## 2026-09-18 — UI CSS development watcher

- Outcome: `npm run dev` now starts Vite and a watcher that rebuilds UI CSS from source.
- Areas: root npm scripts, `tools/dev.mjs`, and `tools/watch-ui-css.mjs`.
- Verification: syntax checks passed; modifying `packages/ui/src/css/ui-components.css` triggered a regenerated UI CSS bundle.

## 2026-09-18 — Vite 8 upgrade

- Outcome: upgraded Vite from 7.3.2 to 8.3.0.
- Areas: root package manifest and lockfile.
- Verification: `npm run build`, `npm test` (55 passing), and `npm run test:browser` (10 passing).

## 2026-09-18 — Dependency security remediation

- Outcome: resolved the `body-parser` and `qs` audit advisories through compatible transitive dependency updates.
- Areas: root package lockfile.
- Verification: `npm audit` reports zero vulnerabilities; `npm run build` and `npm test` pass.

## 2026-09-18 — Vite 8 HTML entry resolution

- Outcome: made the Vite multi-page HTML inputs absolute so dependency scanning works with `root: "pages"`.
- Areas: Vite configuration.
- Verification: `npm run build` and a Vite development request to `/developers.html` complete without a dependency-scan error.
