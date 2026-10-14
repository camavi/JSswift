# Development changelog

## Priorities after split.2: offline SVG, compact reports and traceable validation — 2026-10-13

Implemented all requested priorities from the latest pilot analysis without publishing or modifying historical runs. Added tree-shakable named offline SVG factories at jsswift/icons and @jsswift/ui/icons with declarations: add/edit/search/save/close/check/inventory/grid/empty/euro/chevrons. Factories create fresh decorative native SVG nodes with currentColor, aria-hidden and focusable=false; no runtime catalog, font, sprite or network assets. The package consumer verifies only the imported drawing enters the Vite bundle. Browser tests verify SVG namespace, sizing and distinct nodes. Application string Material icons retain their existing meaning; offline configured applications use icons:false.

Reports now default to compact, retaining selection/assets/sizes/CSS analysis and discovery counts. report:full restores reasons and absolute discovery files/roots. The same formatted report is returned/written; declarations and guides document the shape change. Reformatting the recorded pilot report reduces 8002 -> 1074 bytes, before any new generation. Added contrast-safe secondary text guidance, staged reading guidance and icon discovery keywords to the application docs/map/portable Skill.

CSS pruning now recognizes only mandatory classes outside all selector functions/attributes, preserving alternatives inside :is/:where/:not/:has and escaped selectors conservatively. Tests include mixed alternatives and quoted attribute text. Same CSS input and pilot selection: 163458 -> 134563 raw bytes, gzip 23883 -> 20270; 28895 raw / 3613 gzip saved. Full CSS source unchanged. Both full/selective Chrome surfaces and temporary pilot screenshots inspected without observed layout regressions.

Table's inner overflow region is keyboard-focusable and named; new scrollLabel prop customizes its name. Actual horizontal arrow-key scrolling is verified. Public Table contract updated.

External laboratory tools now record unique selectors, computed foreground/fill, composed background layers, font metrics and exclusion reasons. Separate desktop/mobile/dialog-with-validation reports; modal results exclude underlying content, unsupported complex paint stays unmeasured. Inspector resets the page before initial screenshots and saves DOM markup for locating selectors. Field error checks require four controls and correct field-specific descriptions; new cases cover invalid stored schema, blocked reads and real keyboard scrolling. The unchanged temporary copy of the latest pilot passes 22/22; this is not a new measured generation. Its original app contrast failures remain, and default dialog complex paint is reported unmeasured rather than certified.

Added opt-in --staged-knowledge runner mode: provides AI.md alone in the initial prompt, with a precise separate CRUD read path. Mode and guide hash recorded; initial-knowledge default preserved. This guarantees guide delivery, not later model compliance, and is not directly comparable with historical initial-knowledge runs. No model call added outside the recorded turn. Runner guards reject incompatible modes before DB/generation.

Verification: 90 unit/package tests; 65 Chrome tests, zero skipped; knowledge/MCP 4+2; five benchmark-tool tests; four Python runner tests; builds/registry/whitespace checks. Initial browser SVG fixture requested an unallowed external file; corrected it to serve a copied asset from the temporary root. An unrelated Menu test initially missed its rAF result under concurrent Chrome load, then passed isolated and in the complete final suite; no Menu implementation change. Initial blocked-storage fixture navigated only the hash, so its init script did not execute; corrected to reload and all 22 pass.

No version bump, npm publication, Git commit/push or site deployment. Historical source/logs/results untouched. Local public additions require a separately authorized release.


## Third test preview published and verified — 2026-10-13

User explicitly authorized another npm test publication. Published the exact inspected tarballs jsswift@2.2.0-split.2 and @jsswift/ui@2.0.3-split.2 with tag next. Direct public registry metadata and installed consumer lockfile integrity match the packed artifacts. Tags: jsswift latest=2.1.1, next=2.2.0-split.2; UI latest=2.0.2, next=2.0.3-split.2. Core and MCP unchanged. Ordinary metadata requests temporarily returned stale responses; an uncached public metadata request confirmed publication, followed by successful normal npm install of both exact versions.

Includes dev directory-watcher correction, expanded CSS ownership and cssAnalysis reports, aligned automatic setup/CRUD docs and offline SVG guidance. Runtime build, 87 unit/package tests, knowledge/MCP 4+2, registry and whitespace checks pass. Implementation Chrome suite previously passed 65/65; release changes versions and documentation only.

Installed both packages from npm into a fresh temporary consumer. CLI and production Vite verify default discovery, manual precedence, automatic icon CSS, offline override and matching CSS analysis. Real installed-package Vite 8.3.3 dev server verifies HTTP runtime/CSS loading and automatic source changes/additions/removals, including external roots initially empty. No HTTP500. Reviewed tarballs: /tmp/jss-split-preview2-release; consumer verification: /tmp/jss-preview2-consumer-ngki_sfx/verification.log. No Git commit/push or website deployment.


## Benchmark priorities: dev watcher, validation and CSS — 2026-10-13

Implemented the explicitly requested priorities following the split.1 pilot. Fixed the dev runtime by keeping discovery directory roots in server.watcher rather than addWatchFile load dependencies. Installed-tarball regression reproduced HTTP500 before the correction and passed afterward, including real HTTP runtime/CSS requests and watcher-driven changes/additions/removals. External roots initially empty are covered. The same package regression passed with the benchmark's locked Vite 8.3.3 through JSS_TEST_VITE_PATH.

Added a real Vite/Chrome CRUD regression with native Tab/Shift+Tab/Escape, initial and replacement-trigger focus, four required-control error associations, write failure, corrupt/invalid/unavailable storage and reload persistence. Ten repeated editor openings explicitly dispose eighty temporary rods. These ownership assertions are not a heap-memory audit. Updated the traditional CRUD regression to assert the accessible storage error inside the dialog. Aligned getting-started/CRUD with automatic discovery, made the table region keyboard-focusable and named, retained its white header styling, and verified the inline SVG offline icon example in Chrome.

Extended CSS ownership for Layout, RouteTab, choice controls, check-style controls and Select/Search singularity menus. Unknown/functional selectors remain conservative. Added cssAnalysis to CLI/Vite selective reports with input/output bytes and retained owned/shared-or-unknown/complex/keyframe rule groups; full/core-only reports null. On identical CSS input and the pilot selection: 178366 -> 163458 raw bytes, gzip 25924 -> 23883 (14908 raw / 2041 gzip saved). This is component CSS only, not a new generation or a measured token/time improvement.

Updated the external laboratory's future jsswift-current validator, common inspector and documentation. HTTP/request/console/page exceptions are recorded; loading failure gates downstream checks as blocked. Ancillary failures remain diagnostic rather than failed application modules. Added separate solid-color text contrast measurement with explicit complex-paint/disabled exclusions. Three validator regressions pass, including an HTTP500 with zero pageerror events and end-to-end blocked results. Historical scripts, generated code, run artifacts and generation metrics unchanged.

A temporary unchanged copy of the pilot app with the corrected local plugin passes 19/19 current checks. Desktop/mobile screenshots inspected: no observed layout regression, no page overflow. The limited separate contrast report identifies 9 below-threshold leaf texts from application styling, 46 passing, 10 complex/unmeasured and 1 disabled exclusion; this is not a complete accessibility audit and does not change historical results.

Verification: runtime/umbrella/site builds; 87 unit/package tests; 65 Chrome tests, zero skipped; final offline SVG/CRUD focused regression; knowledge/MCP 4+2; registry and whitespace checks. First browser run exposed stale assertions for the updated CRUD alert and white-header example; corrected example styling and alert selector, then all 65 passed. No version bump, npm publication, Git commit/push or deployment.


## Second test preview published and verified — 2026-10-13

User explicitly requested another test publication. Published the inspected tarballs jsswift@2.2.0-split.1 and @jsswift/ui@2.0.3-split.1 with tag next. Both versions are visible and installable from npm; registry integrity matches the tarballs. Tags verified: jsswift latest=2.1.1, next=2.2.0-split.1; @jsswift/ui latest=2.0.2, next=2.0.3-split.1. Core and MCP versions unchanged.

Includes automatic discovery defaults, manual-list precedence, automatic Material font CSS, offline opt-out, CSS ownership improvements and updated application guidance. Runtime builds, 86 unit/package tests, knowledge/MCP tests (4+2), registry and whitespace checks passed. Existing implementation browser verification remains 64/64; this publication changes versions and release documentation. Initial sandbox test attempts failed on npm cache access, then an empty-cache offline install; rerunning with the existing cache outside sandbox passed.

Installed both published packages into a clean temporary consumer. Main-package CLI and Vite builds passed with implicit discovery, Button/Icon inclusion, Table exclusion, automatic Google font declaration, explicit-list discovery precedence and icons:false omission of remote font CSS. Verification checks declarations rather than external font-server availability. Tarballs and inspection metadata: /tmp/jss-split-preview1-release; consumer verification: /tmp/jss-preview1-consumer-c25a27oh/verification.log. No Git commit/push or website deployment performed.


## 2026-10-13 — Default discovery and automatic Material assets (local)

- Configured builds discover static components/services by default. Explicit lists select manual mode without auto:false; explicit auto enables merging. Custom build output is excluded from scanning/restarts.
- Icon dependency inclusion automatically adds Material Symbols font-face CSS; icons:false supports offline/SVG-only apps. Explicit extras still apply. AI/Icon/configuration contracts include native icon examples and distinguish these local changes from the published preview.
- Added missing TabPanel/EmptyState/Stat CSS ownership. Identical benchmark selection saves 13210 raw / 1626 gzip component-CSS bytes; generation timing/tokens were not remeasured. AI.md reduced from 11315 to 11062 characters with concise report inspection guidance.
- Verification: UI/umbrella/site builds, 86 unit/package tests, all 64 Chrome tests, knowledge/MCP (4+2), registry and diff checks passed. No publication/version/tag change for this work.

## 2026-10-13 — Installable split preview

- Published and verified `jsswift@2.2.0-split.0` on npm tag `next`; `latest` remains 2.1.1. Fresh npm installation passed CLI/Vite automatic discovery, explicit dynamic inclusion, Button-only selection and Chrome rendering/model/click smoke tests. Registry tarball integrity matches the reviewed artifact.
- npm accepted `@jsswift/ui@2.0.3-split.0` on `next`; registry processing still pending at the last check, with latest unchanged at 2.0.2. Core/MCP unchanged. No commit/push/deployment.

## 2026-10-13 — Complete component/source split

- All 66 public UI names now map to 63 component implementation files, with shared helpers and four dedicated services. Every component CSS rule is extracted; the ordered entry combines 198 component/shared sections and preserves the approved cascade. Upload migration is complete.
- The manifest registers all assets/aliases and derived helper/dependency inventories, and supplies selective CSS ownership. Registry refresh/check commands and exhaustive source/installed-package coverage guard against stale or orphan assets.
- Verification: full and all 70 component/service selections preserve JavaScript and dependency outputs; CSS rules and cascade match, with one inherited trailing space cleaned. UI/umbrella/site builds, 83 unit/package tests, all 64 Chrome tests, registry/knowledge/whitespace checks passed. Local only; no release or deployment.

## 2026-10-12 — Layout-family extraction

- Row, Col, Spacer, Container, Card, Layout, Footer, Toolbar, Grid and GridCol now have individual JS sources and registered CSS sections; shared responsive/model/disposition/children helpers preserve initialization order. Upload JS is isolated, with its CSS migration explicitly pending.
- Full builds and all ten individual selective JS/CSS builds match the captured pre-migration output and dependency selections.
- Verification: UI/umbrella builds, 82 unit/package tests, 18 targeted Chrome tests without skips, knowledge map and whitespace checks passed. Local only; display/content and advanced forms remain to migrate.

## 2026-10-12 — Automatic discovery and component extraction pilot

- Configured CLI/Vite builds support opt-in static application discovery with explicit dynamic inclusions and development invalidation.
- Seven field/button components now own JS files and 23 ordered CSS sections; shared extracted helpers and component assets are registered in modules.json. Full generated runtime/CSS retain the accepted content; nested packaging and CSS watching are supported.
- Verification: UI/umbrella builds, 82 unit/package tests and knowledge map passed; 63 of 64 Chrome tests passed initially, with the ContextMenu RAF measurement test passing in isolation. Remaining families and shared style ownership still need migration. Local only.

## 2026-10-08 — Release 2.0.1 and knowledge MCP 0.1.12

- Publication: all four npm commands accepted; initial fresh-cache registry check returns E404 while npm processes the packages. Release commit 7c1fb74.

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

## Fourth test preview verified — 2026-10-13

Explicit user request: published jsswift@2.2.0-split.3 and @jsswift/ui@2.0.3-split.3 on next. latest unchanged at 2.1.1 and 2.0.2. Both installed from npm; consumer lockfile integrity matches inspected tarballs. Includes named offline SVG factories, compact/full report modes, safe functional CSS pruning and named keyboard table scrolling. Runtime builds, 90 unit/package and knowledge/MCP 4+2 passed; implementation browser suite already passed 65/65. Registry-installed consumer CLI/production/dev Vite 8.3.3 passed; imported add drawing present, unused edit drawing absent; compact report and no remote font confirmed. Dev source changes/additions/removals and external roots passed. Registry processing initially delayed availability; no duplicate publication. Artifacts: /tmp/jss-preview3-release; consumer verification: /tmp/jss-preview3-consumer-056deeyb/verification.log. No Git push or website deployment.

## Post split.3 corrections after baseline commit — 2026-10-13

User explicitly requested a commit before corrections. Created baseline commit 99153415 with the completed split/runtime/offline-icon work and preview versions, then applied this separate uncommitted correction set. No push or publication.

Reproduced pager with the installed split.3 runtime and Playwright full-page screenshot path on an unchanged temporary pilot copy. Button transition:all inherited from singularity animates flex-grow from zero to one after desktop/mobile resize; intermediate button widths were about 22.5px and settled at 154px after the 200ms transition. The previously suggested flex basis explanation was incomplete: library layout animation caused the transient screenshot failure. Buttons now animate feedback transform/shadow/colors only, preserving layout changes instantly.

Measured Table Card shadow despite shadow:none. Common props activated jss-shadow for the truthy none token, allowing Table's more specific effect rules to add elevation. none now avoids the generic effect class, including reactive models. Embedded Table suppresses its elevation even when effect props are enabled, in both themes. Focused Chrome regression covers full/selective outputs, resize label bounds, normal vs disabled/embedded shadows and reactive class transitions.

Future laboratory validator identifies named role=region with table content and real overflow without requiring the word tabella. It verifies actual ArrowRight scrolling for customized Elenco prodotti. Added geometry-stabilization wait to screenshots and visual pager test. Current selectors accept public Input names and either custom metric-value or native KPI values. Historical scripts, source and result files untouched; the run moved externally from runs to archive during verification and was located there without mutation.

Seven validator tests pass, including custom-name acceptance, unnamed-region rejection and transient layout settling. An unchanged temporary copy of the archived pilot with local runtime passes 23/23; desktop/mobile screenshots inspected with readable pager and no Table shadow. Added a documented two-column external pager and Kpi guidance, clarified selection/reading budget and documented staged-knowledge as a distinct mode for future comparisons. No new generation or measured token/time claim. Existing conservative CSS pruning remains; no unsupported unused-CSS removal was made. Contrast scope/exclusions remain explicit.

Verification: runtime/site/umbrella builds, 90 unit/package tests, 66 Chrome tests (zero skips), knowledge/MCP 4+2, registry and whitespace checks passed. Corrections are local and uncommitted, separate from baseline commit, ready for review.

## 2026-10-13 — split.4 preview publication

Published jsswift 2.2.0-split.4 and @jsswift/ui 2.0.3-split.4 under next, preserving stable latest tags. Includes Button feedback-only transitions, shadow:none handling, embedded Table elevation suppression and focused application guidance. Verified runtime build, 90 tests, knowledge/MCP 4+2 and focused Chrome regression; fresh registry installation matches packed integrity, Vite 8.3.3 production and dev discovery checks passed. External benchmark validator changes are separate tooling and historical runs remain unchanged. No push/site deployment.

## 2026-10-13 — post split.4 supported improvements

Internal close controls (Dialog/Popover/Alert/Banner/Chip/FormField/Upload cancel) and date navigation now use built-in SVG. Explicit custom Material names and sprite configuration remain supported. Sprite/custom Icon nodes omit the Material font class. Dialog adds opt-in class jss-dialog-solid: opaque theme-aware surfaces, labels/errors, primary blue/white actions; the default decorative contract is unchanged. Docs retain AI.md -> CRUD, discourage duplicate table regions, and require separate HTTP checks and explicit sandbox limitations.

CSS ownership adds jss-control -> FormField from its sole constructor. Button/Btn/Icon/Tooltip component-CSS selection drops 12,355 bytes versus an equal-length unowned spelling; no reduction claimed for FormField/CRUD builds. Unknown/functional-selector policy remains conservative.

Verified 91 unit/package and 67 Chrome tests, zero skips; knowledge/MCP 4+2, registry, runtime/site builds, whitespace. Solid dialog light/dark full/selected screenshots inspected and sampled leaf text contrast >=4.5; offline default close and custom override verified. This is not a complete accessibility or heap audit. Changes are local and require separate release authorization.

## 2026-10-13 — split.5 preview publication

Published jsswift 2.2.0-split.5 and @jsswift/ui 2.0.3-split.5 under next, preserving latest. Includes internal close/calendar SVG, solid dialog opt-in, control CSS ownership and focused documentation. Runtime rebuild, 91 tests, knowledge/MCP 4+2 and tarball inspection passed; prior 67 Chrome tests passed. Fresh registry install integrities match artifacts and Vite 8.3.3 production/dev HTTP/discovery checks passed. No push or site deployment.

## 2026-10-14 — benchmark work closed

User closed the split preview benchmark work and requested the final repository commit. Read-only review of split.5 run 3f4c0a08e15a4ae6a35a0216e22251e0 confirmed build and 23/23 checks in dev/production; the 13 measured dialog text samples passed contrast. Remaining complex-paint exclusions and AI reading variability are documented limitations, not proof of framework failures. No new implementation, release or benchmark mutation in this closure.
