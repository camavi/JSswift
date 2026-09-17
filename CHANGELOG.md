# Changelog

All significant JSswift changes are documented here.

The format is kept intentionally simple:

- Added
- Changed
- Fixed
- Docs

## [1.0.24] - 2026-05-05

### Changed

- added layout disposition presets for `UI.Layout`
- added local/global layout mode metadata for `UI.Layout`
- regenerated readable and minified UI runtime bundles after the layout update
- package versions bumped to `1.0.24`
- README CDN examples now pin `1.0.24`

### Docs

- added `v1.0.24` release notes

## [1.0.23] - 2026-04-30

### Changed

- standardized developer-facing UI component metadata in English
- regenerated readable and minified UI runtime bundles after the metadata refresh
- package versions bumped to `1.0.23`
- README CDN examples now pin `1.0.23`

### Docs

- added `v1.0.23` release notes

## [1.0.22] - 2026-04-30

### Fixed

- `UI.Search` result mouse clicks now select the clicked item reliably.
- `UI.Search` no longer opens an empty result panel on input focus when no loading, error, result, empty, or start content exists.

### Changed

- package versions bumped to `1.0.22`
- README CDN examples now pin `1.0.22`

### Docs

- added `v1.0.22` release notes

## [1.0.21] - 2026-04-30

### Added

- `UI.Search` / `_.Search` with reactive model support, GET search, debounce, result overlay, and keyboard navigation
- local search source support through `items`, `options`, or `suggestions`
- search demo coverage in the UI playground

### Changed

- package versions bumped to `1.0.21`
- README CDN examples now pin `1.0.21`
- README now links the official site at `https://www.jsswift.com/`

### Fixed

- search floating label and placeholder overlap
- default search field styling

### Docs

- added `v1.0.21` release notes

## [1.0.7] - 2026-04-22

### Added

- official JSswift SVG logo added as a local runtime asset
- package exports for `@jsswift/ui/img/logo.svg` and `jsswift/img/logo.svg`
- demo header branding and SVG favicon coverage across the local pages

### Changed

- demo/runtime settings now point to the local SVG logo instead of remote PNG/ICO assets
- package versions bumped to `1.0.7`

### Docs

- README now shows the official logo and documents the brand asset entry points
- added `v1.0.7` release notes

## [1.0.5] - 2026-04-17

### Added

- baseline styling for native `input` elements in the generated UI CSS
- demo coverage for both `_.input()` and `_.Input()` helpers

### Changed

- `.cms-field > .cms-control` now uses a theme surface background token for better visual separation
- the home page primary CTA was visually aligned with the other entry buttons

### Docs

- added `v1.0.5` release notes

## [1.0.4] - 2026-04-16

### Added

- `JSswift.getTheme()` to read the active theme from `html[data-theme]` with storage fallback
- `JSswift.toggleTheme()` to cycle through any number of themes instead of assuming only `light/dark`
- automatic theme restore from `localStorage` during core bootstrap
- core tests for theme persistence and multi-theme toggling

### Changed

- `JSswift.setTheme()` now persists the selected theme in `localStorage`
- theme helpers are now documented in the public README and core technical reference
- demo theme switching was aligned with the updated runtime helper behavior

### Fixed

- UI toggle styling was adjusted for better consistency in dark theme usage

### Docs

- added `v1.0.4` release notes

## [1.0.3] - 2026-04-15

### Removed

- removed the obsolete icon sprite CSS artifact from generated UI CSS outputs and package exports
- removed Tabler icon sprite CSS from `ui.css`, `min-ui.css`, and `ui.min.css`
- removed the same CSS from the umbrella `jsswift` package output

### Changed

- CSS build now keeps only the active generated CSS files and removes stale CSS outputs
- package versions bumped to `1.0.3`

### Docs

- README CSS export list no longer references the removed icon sprite CSS artifact
- added `v1.0.3` release notes

## [1.0.2] - 2026-04-15

### Added

- conventional minified CDN aliases:
  - `packages/core/dist/cms.min.js`
  - `packages/ui/dist/ui.min.js`
  - `packages/ui/dist/css/ui.min.css`
  - `packages/jsswift/dist/jsswift.min.js`
  - `packages/jsswift/dist/css/ui.min.css`
- package exports for the new minified aliases
- README CDN examples for readable and minified builds

### Changed

- bumped package versions to `1.0.2`
- kept `const _ = window._;` explicit in the README quick start for tooling clarity

### Docs

- added `v1.0.2` release notes

## [1.0.1] - 2026-04-14

### Added

- npm publish of `@jsswift/core`
- npm publish of `@jsswift/ui`
- npm publish of the umbrella package `jsswift`
- public README coverage for npm and CDN usage
- a self-contained `jsswift` package tarball with `dist/jsswift.js`, CSS, and bundled assets

### Fixed

- core bootstrap now works even when `window.JSswift_setting` is not defined
- core HTTP configuration now uses safe fallbacks when the global config is missing
- browser-first npm consumption is more robust in projects that import `@jsswift/core` without legacy setup
- CSS exports in `jsswift` now point only to files inside the package
- umbrella package build now includes aligned JS, CSS, fonts, and images

### Docs

- updated the public quick start for `@jsswift/core`, `@jsswift/ui`, and `jsswift`
- added dedicated release notes for `v1.0.1`
- reclassified `v1.0.0` release material as historical pre-release archive

## [1.0.0] - historical pre-release baseline

### Added

- full core modularization under `packages/core/src`
- full UI layer modularization under `packages/ui/src`
- standard and minified runtime builds:
  - `cms.js`
  - `min-cms.js`
  - `ui.js`
  - `min-ui.js`
- umbrella bundles `jsswift.js` and `min-jsswift.js`
- internal technical documentation for core and UI
- `v1` pre-release checklist
- stability and compatibility policy
- browser smoke checklist for release
- first `v1.0.0` release notes baseline

### Changed

- consolidated renderer structure
- consolidated reactive core
- realigned `rod` with the DOM bridge and form controls
- split platform modules and UI modules into dedicated source files

### Fixed

- CSS custom property handling in the renderer
- prop removal and update semantics
- dynamic children, class handling, event cleanup, and general cleanup paths
- rare form-control edge cases
- real bugs surfaced by demos and core tests

### Docs

- added the public `README.md`
- added `docs/reference/core.md` and `docs/reference/ui.md` as technical references
- added `LICENSE`

## Notes

The `1.0.0` release remains the historical pre-release baseline.
The first release published and consumed through npm in this repository is `1.0.1`.
