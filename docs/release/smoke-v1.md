# JSswift v1 Browser Smoke Checklist

Minimum manual checklist to execute before a `v1` release.

Note:

- this document remains the operational baseline of the first public release
- the latest reference verification was closed on `2026-04-14`

Rule:

- if one item fails, the release stops
- the check must run against the current runtime build at minimum
- verify both the standard and minified bundles when possible

Reference preflight status:

- local HTTP preflight executed on `2026-04-14`
- `200 OK` verified for:
  - `pages/index.html`
  - `pages/_jsswift-fe/js/cms.js`
  - `pages/_jsswift-fe/js/ui.js`
  - `pages/_jsswift-fe/js/min-cms.js`
  - `pages/_jsswift-fe/js/min-ui.js`
- interactive browser validation is still required for future releases

Reference smoke status:

- manual browser smoke executed
- main core and UI demos verified
- recorded result: `PASS`

## 1. Runtime Files

- [x] `pages/_jsswift-fe/js/cms.js` loads without errors
- [x] `pages/_jsswift-fe/js/ui.js` loads without errors
- [x] `pages/_jsswift-fe/js/min-cms.js` loads without errors
- [x] `pages/_jsswift-fe/js/min-ui.js` loads without errors

## 2. Demo Shell

- [x] [index.html](../../pages/index.html) returns `200 OK` in local HTTP preflight
- [x] [index.html](../../pages/index.html) loads without console errors
- [x] demo routing works
- [x] main shell drawer works
- [x] main layout is responsive in a quick desktop/mobile check

## 3. Core Demo

- [x] `/demo/component/cms-renderer`
- [x] `/demo/component/cms-reactive`
- [x] `/demo/component/cms-rod`
- [x] `/demo/component/cms-lifecycle`
- [x] `/demo/component/cms-platform`
- [x] `/demo/component/cms-renderer-style`

## 4. Priority UI Demos

- [x] layout
- [x] form
- [x] input
- [x] select
- [x] table
- [x] tabs
- [x] dialog
- [x] menu
- [x] popover
- [x] tooltip
- [x] app-shell

## 5. What To Verify

For each key demo:

- [x] no console errors
- [x] no unexpected new warnings
- [x] core interactions work
- [x] reactive state stays coherent
- [x] overlays open and close correctly
- [x] basic keyboard behavior is not broken

## 6. Release Gate

The release can continue only if:

- [x] all checks above have passed
- [x] any failures are documented and closed
- [x] no blockers remain open in `docs/release/release-plan-v1.md`
