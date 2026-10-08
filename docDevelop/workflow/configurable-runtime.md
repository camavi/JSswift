# Configurable runtime work log

## Objective

Build application assets from jss.config.js. ui.all:true includes the complete UI; selective builds include requested components/services and their dependencies. Preserve existing imports, script bundles and the _ namespace.

## Milestones

1. Complete: configuration validation, full-UI/core-only standalone builds, explicit extras and inclusion report.
2. Complete: source statement inventory and dependency extraction across the shared UI IIFE. All 66 component exports initialize independently.
3. Complete: selective JavaScript and component-owned CSS pruning; dependencies and inclusion reasons are reported.
4. Complete in repository: Vite integration, config reload, ui.html demo migration and browser verification. Package exports, CLI and declarations are now prepared and verified from an installed local tarball; registry publication is a separate release task.

## Decisions

- Configuration operates at build time. Never silently include the complete UI for a selective request.
- Extract source statements with a JavaScript AST, retaining original execution order and the shared IIFE. This avoids duplicating component implementations or breaking helper closures.
- JavaScript dependency traversal is conservative, including referenced optional branches and public methods/aliases.
- CSS ownership controls pruning. Retain shared tokens, native styles, utilities, animations, unknown selectors and functional selectors conservatively.
- Core remains complete. Application dynamic component lookup must be covered explicitly by its configuration.
- Existing runtime outputs remain full builds. Standalone output is isolated; destinations must be empty. Vite owns its own output normally.
- ui.html imports jss:runtime through pages/demo/ui-runtime.js. Default demo config keeps all UI and Material Symbols.
- Application CSS can import assets independently; demo.css still explicitly loads its own Nunito fonts.

## Verification

- npm test: 70 pass, zero failures.
- npm run test:browser: 26 pass, zero failures, including the selective runtime Chrome test.
- npm run build and npm run build:jsswift: pass. Site build retains existing warnings for classic script tags.
- npm run knowledge:check: valid (13 topics, 58 documented components).
- git diff --check: pass.
- Unit coverage includes dependency resolution, actual minified runtime execution, omission of unused components, standalone CSS pruning, services, Vite output, opt-in extras and invalid configs.

## Size comparison

Minified standalone JavaScript, unminified CSS, responsive:false and no extras:

| Selection | JavaScript bytes | CSS bytes |
| --- | ---: | ---: |
| Complete UI | 448545 | 233369 |
| Button and automatic dependencies | 109302 | 99715 |
| Table and automatic dependencies | 127579 | 107170 |

Shared CSS is intentionally retained. Measurements apply to these configurations and are not gzip sizes.

## Remaining release work

Registry publication, complete selector ownership, stronger dependency analysis and physical source component splitting can be addressed separately. The repository CLI and Vite integration are usable now; no publication or commit has been performed for this implementation.

## Package distribution milestone

- Complete: jsswift/vite and jsswift/build exports, jss-build executable and TypeScript declarations.
- Tooling resolves checkout and installed-package paths through runtime-layout.mjs. The npm build copies UI module sources/manifest, core/UI runtimes and tools into dist; font/sprite assets are already packaged.
- Explicit production dependencies: esbuild, postcss and rolldown. Vite is an optional peer and is needed only for Vite integration.
- Corrected CLI entrypoint detection through npm binary symlinks; --help is available.
- Installed-tarball test packs locally, installs offline into a temporary consumer, invokes the executable and builds through the exported Vite plugin. It covers selective/full/core-only builds, Tabler, Google font CSS and local Nunito assets.
- Verification: 71 tests pass; umbrella and site builds succeed; knowledge map and diff checks pass. No browser behavior changed in this milestone.
- No registry publication, version change or commit was performed.

## AI documentation milestone

- AI.md routes configured applications to guide:configured-runtime and explains all/selective mode, assets, responsive CSS and package availability without changing the executable traditional example.
- Knowledge map adds the configured-runtime topic; queries jss.config.js, jss:runtime, jsswift/vite, jss-build and componenti selettivi resolve to the new guide.
- Portable application skill includes the focused routing instruction. Bundled package docs and standalone MCP regenerated.
- Verification: 4 knowledge tests and 2 MCP tests pass, including installed-package MCP discovery; 14 topics/58 components valid; diff check passes.

## Release preparation

- User authorized commit and npm/MCP publication.
- Versions: jsswift 2.1.0 and @jsswift/knowledge-mcp 0.1.13; core/UI packages unchanged at 2.0.1.
- Fresh registry version lists confirm target versions absent.
- Runtime/site builds, 71 unit/package tests and 6 knowledge/MCP checks pass. Tarball dry-runs verified tool exports, source manifest, executable and AI docs.
- Publication follows the release commit; registry confirmation will be recorded afterward.

## Verified publication

- Implementation/release commit: 369618d.
- npm accepted jsswift 2.1.0 and @jsswift/knowledge-mcp 0.1.13. Both became visible after registry processing; fresh prefer-online queries confirm their versions and executable mappings.
- jsswift binary: jss-build -> dist/build/build-configured-runtime.mjs. MCP binary: jsswift-mcp -> dist/server.mjs.
- npm normalized the leading ./ in the framework bin path. Its warning misleadingly described removal; source inspection and published metadata confirm the executable was retained. Local manifest now uses the normalized path. Installed-tarball verification passes again.
- Final release verification: runtime/site/package builds, 71 tests, 26 browser tests, 6 knowledge/MCP checks and tarball reviews pass.
- No git push or site deployment performed.
