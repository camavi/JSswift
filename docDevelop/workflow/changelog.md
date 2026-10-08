# Development changelog

## 2026-10-08 — Release 2.0.1 and knowledge MCP 0.1.12

- Shorter AI entrypoint and focused CRUD discovery. Executable focus and field-height CSS examples retained.
- CRUD uses public white Table styling, restores focus at disabled pager boundaries and refreshes KPI only when inventory changes.
- Verification: runtime/site builds, 64 unit, 25 browser checks including two corrected-documentation reruns, and 6 knowledge/MCP checks. Package contents inspected.

## 2026-10-07 — Release JSswift 1.0.51 and knowledge MCP 0.1.7

- Outcome: selective MCP contract reads and focus CSS/Table guidance distributed.
- Verification: runtime builds, 6 knowledge/MCP tests, targeted browser focus CSS test, knowledge map/Skill and package contents checks.
- Publication: all four npm publish commands accepted. npm latest confirmed for @jsswift/core and @jsswift/ui 1.0.51 and @jsswift/knowledge-mcp 0.1.7. jsswift 1.0.51 remains unavailable after 24 polls; latest is still 1.0.50.

## 2026-10-07 — Focus CSS guidance and selective MCP reads

- Outcome: AI guide provides a correct focus-visible selector; Table contract distinguishes toolbar, row status and external paging. MCP read supports props/events/methods/slots and selected keys with inherited props resolved; full reads remain compatible.
- Verification: 6 knowledge/MCP tests including selected props, inherited padding and unknown-key rejection; Chrome verifies inactive/disabled elements have no visible outline and focused text control has the documented ring. Map and portable Skill rebuilt; diff check.
- Limits: no benchmark modification, token-savings claim or rendering optimization without profiling. Local changes only.

## 2026-10-07 — Release JSswift 1.0.50 and knowledge MCP 0.1.6

- Outcome: Dialog respects onOpen focus; field messages are associated automatically; CRUD and verification guidance updated.
- Verification: runtime builds, 59 runtime tests, 14 browser tests, 6 knowledge/MCP tests, map and package contents checks. Grid browser probe uses a timer instead of a headless animation frame; layout assertions preserved.
- Publication: npm latest verified for jsswift, @jsswift/core and @jsswift/ui 1.0.50, and @jsswift/knowledge-mcp 0.1.6.

## 2026-10-07 — Explicit Dialog focus and accessible field messages

- Outcome: deferred overlay autofocus preserves focus assigned inside onOpen and ignores closed entries. FormField messages have stable IDs associated through aria-describedby while preserving external references. CRUD reuses its currency formatter and documents rendering limits; AI guidance separates environment, startup, HTTP and interaction evidence.
- Verification: reproduced initial focus failure before fix; 59 runtime tests, 14 browser tests and 6 knowledge/MCP tests pass. Browser coverage includes initial CRUD focus, default autofocus/opt-out, reactive error association/removal, external descriptions, add/edit/reload and keyboard handlers.
- Limits: no screen-reader audit or large-dataset performance claim. Rendering strategy changes deferred until profiling establishes a benefit. Local changes only, no publication.

## 2026-10-07 — Release JSswift 1.0.49 and knowledge MCP 0.1.5

- Outcome: public field focus/accessibility/constraints and verified CRUD example included in application documentation.
- Verification: runtime build, 59 runtime tests, 13 browser tests, 6 knowledge/MCP tests, map validation, portable Skill generation and package contents checks. CRUD Escape assertion waits for completed focus restoration.
- Publication: npm latest verified for jsswift, @jsswift/core and @jsswift/ui 1.0.49, and @jsswift/knowledge-mcp 0.1.5.

## 2026-10-07 — Verified compact CRUD example

- Outcome: application guide includes an optional CRUD example using public field APIs, rod models, validation, storage, search, category filtering and paging. Fresh editor fields are created for each opening because closing overlays cleans mounted content.
- Verification: Chrome regression covers add, edit, invalid fields/numbers, Select-to-rod binding, search/filter/paging, focus restoration, dispatched Tab/Escape handlers, mobile overflow and persistence through a real page reload. Six knowledge/MCP tests pass; map and portable Skill rebuilt.
- Limits: keyboard events are dispatched by the browser test; no screen-reader, contrast or storage-failure verification. No commit or publication.

## 2026-10-07 — Public Input and Select focus and attributes

- Outcome: fields expose focus(options?), control-level accessible names, descriptions, required and reactive invalid state. Input forwards native numeric/text constraints, including zero. Existing model APIs are preserved.
- Verification: UI/umbrella builds, 59 runtime tests, 6 knowledge/MCP tests and 12 browser tests including real control focus, rod error updates and native constraints; map refresh and portable Skill build.
- Distribution: local changes only; no commit or publication. Full CRUD example remains a separate follow-up.

## 2026-10-07 — Release JSswift 1.0.48 and knowledge MCP 0.1.4

- Outcome: npm root guide and README, manifest discovery paths and AI-first knowledge map published together.
- Verification: runtime build, 59 runtime tests, 6 knowledge/MCP tests including tarball entrypoints, map validation, portable Skill build and npm package inspections.
- Publication: npm latest verified for jsswift, @jsswift/core and @jsswift/ui 1.0.48, and @jsswift/knowledge-mcp 0.1.4.

## 2026-10-07 — Discoverable short npm documentation path

- Outcome: npm root README, generated root AI.md and manifest discovery paths lead applications to the short guide first. The knowledge map starts at AI.md; guidance reserves full contracts for missing APIs and corrects the index to prefer rod field models.
- Verification: knowledge refresh/check and portable Skill build; 6 knowledge/MCP tests including packed root guide equality, README availability and map entrypoint checks; diff check.
- Distribution: local build updated; no commit or npm publication performed. Token savings remain to be measured in a new benchmark.

## 2026-10-07 — Release JSswift 1.0.47 and knowledge MCP 0.1.3

- Outcome: release includes full signal tuple model support, Button documentation alias and rod-first application guidance.
- Verification: runtime build; 59 runtime tests, 11 browser tests, 6 knowledge/MCP tests; knowledge map and Skill validation; npm package contents and diff checks.
- Publication: npm latest verified for jsswift, @jsswift/core and @jsswift/ui 1.0.47, and @jsswift/knowledge-mcp 0.1.3; release implementation commit pushed to GitHub.

## 2026-10-07 — Prefer rod for AI field models

- Outcome: AI quick-start, reactivity guide, Skill and MCP instructions recommend `_.rod()` for field models, with `.value` examples; signal remains supported for explicit getter/setter state.
- Verification: 6 knowledge/MCP tests pass; browser regression verifies Select user selection, saving and programmatic updates for rod and both supported signal shapes; Skill validation and `git diff --check` pass.
- Distribution: documentation and generated local artifacts updated; no publication performed.

Record significant completed framework work: date, outcome, affected areas, and verification.

## 2026-10-07 — Select signal binding and Button documentation alias

- Shared signal detection accepts the public [get, set, dispose] tuple while retaining [get, set] compatibility. Reproduced the pre-fix browser failure: full tuple displayed Casa but saved an empty model, whereas the pair worked. After the fix both forms commit Casa synchronously and reflect programmatic Ufficio updates.
- Added components/button.md as an explicit pointer to canonical btn.md, included in bundled/portable documentation; knowledge validation and refresh preserve canonical component IDs and validate alias paths. Clarified model selection and Button paths in docs.
- Verification: 59 project tests, 11 browser tests, and 6 knowledge/MCP checks passed; UI/umbrella and portable documentation rebuilt; whitespace checks passed. No MCP added to benchmark, no benchmark artifacts modified, no npm release published.

## 2026-10-06 — JSswift 1.0.46 and knowledge MCP 0.1.2 release

- Publication: all four packages accepted by npm and verified publicly with latest tags: core/UI/jsswift 1.0.46 and knowledge MCP 0.1.2. Implementation commit: 5058499.
- Framework and lockfiles updated to 1.0.46; MCP package, lockfile, and server identity updated to 0.1.2. Includes UI metadata removal, AI.md, shared exact contracts, updated Skill/MCP routing, and contract validation.
- Verification: runtime/production builds, project/browser/knowledge/MCP tests, tarball inspection, version availability, and whitespace checks completed. Portable Skill regenerated.

## 2026-10-06 — AI quick start and shared component contracts

- Added documentions/AI.md with Vite imports, six native components, exact callback signatures, signal-based value access, validation, dialog lifecycle, CSS guidance, and focused links. Exposed jsswift/AI.md and indexed guide:AI through Knowledge Map/MCP and portable Skill.
- Shared identical common property definitions through ui/common-props.md; preserved all component-specific definitions. Transformation verified reconstruction of every original props object. Knowledge loader validates shared references and keys.
- Corrected Input callback documentation: implementation passes the value only. Documented existing Dialog ariaLabel. No focus/getValue/setValue methods or automatic accessibility behavior invented.
- Verification: executable quick-start example test, discovery and packed MCP integration tests, and Skill validation passed. No benchmark rerun or token savings claimed. Changes local, not published.

## 2026-10-06 — Remove component metadata from UI runtime

- Removed UI.meta component registrations and descriptive normalization tables from modular UI source. Exact contracts remain in documentions/components and are served through the Knowledge Map, portable Skill, and MCP. Core utilities still support application-supplied metadata, but no component catalog is populated by UI.
- UI minified output shrank from 473,621 to about 364,798 bytes (23%); umbrella minified runtime from 553,856 to about 445,179 bytes (19.6%).
- Verification: UI/umbrella builds; 58 project tests, 10 browser tests, and 5 knowledge/MCP tests passed. Regression checks verify absence of registrations, normalization tables, and runtime catalog while all documented component aliases remain available. No release published for this change.

## 2026-10-06 — JSswift 1.0.45 and knowledge MCP 0.1.1 release

- Prepared all framework packages at 1.0.45 and MCP at 0.1.1, including runtime server identity and lockfiles. MCP instructions route styling and optional-asset questions to focused guides.
- Verification: runtime and production builds, 58 project tests, 10 browser tests, and 5 knowledge/MCP tests passed; inspected all four npm tarballs. Temporary Vite consumer builds verify default imports emit no font or Tabler assets and optional imports emit the expected assets.
- Publication: npm accepted all four packages with public access and latest tags; registry confirmed core/UI/jsswift 1.0.45 and knowledge MCP 0.1.1 after processing. Implementation commit: f740e2b.
- Browser test maintenance: replaced virtual-time dump-dom with the suite's live-page result wait for the Menu resize test; assertions unchanged.

## 2026-10-06 — Focused application discovery and styling guidance

- Compacted seven component JSON contracts without removing or changing metadata. Added source-checked examples for Table callback argument order, Input/Select value callbacks, and Dialog imperative lifecycle.
- Getting started now shows Vite imports; application rules prioritize existing component CSS, documented style/responsive props, and theme variables. Added scoped discovery and unrelated-project benchmark guidance.
- Verification: knowledge refresh and portable Skill build; framework and MCP builds; three knowledge tests and two MCP integration tests, including packed npm distributions, passed. Benchmark not rerun; no measured token savings claimed.

## 2026-10-06 — Optional fonts and Tabler

- Default UI CSS uses system fonts and no longer includes Nunito or the remote Material Symbols font. Explicit CSS exports enable each font separately.
- Added jsswift/tabler and @jsswift/ui/tabler modules to configure the packaged SVG sprite explicitly; inline icons and built-in chevrons remain independent. Optional assets still ship in npm packages.
- Verification: UI and umbrella builds, knowledge map validation, all 58 tests, and temporary Vite consumer builds (default: no fonts or sprite; opt-in: 16 Nunito files and one Tabler sprite). Tabler runtime configuration verified.

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
