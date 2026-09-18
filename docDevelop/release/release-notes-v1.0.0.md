# JSswift v1.0.0 Release Notes

Status:

- initial release-discipline baseline
- historical pre-release document
- not the first actual npm publish

Note:

- the first release actually published from the current repository is `v1.0.1`
- this document remains useful as the baseline for the initial release discipline

## Summary

`v1.0.0` marks the first disciplined release baseline for JSswift as a runtime and UI framework with:

- a modular core
- standard and minified runtime builds
- aligned internal technical documentation
- a package-oriented structure ready for publishing
- automated core tests

## Included In v1.0.0

Core:

- consolidated DOM renderer
- reactive core with `signal`, `effect`, `computed`, `untracked`, and `batch`
- `rod` with a more coherent bridge and binding model
- more robust lifecycle, mount, and cleanup behavior
- aligned platform modules

UI:

- completed `ui.js` modularization
- `ui.js` and `min-ui.js` runtime outputs
- main components organized by family

Build:

- `cms.js`
- `min-cms.js`
- `ui.js`
- `min-ui.js`

Quality:

- automated core tests
- browser demos for core and UI
- dedicated pre-release checklist

## Stable

The main `stable` surface for this baseline is:

- core renderer
- reactive core
- base lifecycle
- base `rod`
- consolidated primary UI components
- official runtime outputs

## Unstable / Experimental

The following areas still remained not fully stabilized for this baseline:

- advanced overlays
- `Date`
- `Time`
- `UI.meta` and dev helpers as stable public API

Explicit decision for `v1.0.0`:

- advanced overlays remain `unstable`
- `Date` and `Time` remain `unstable`
- `UI.meta` remains `dev-only`
- `reactive` is the core primitive layer, while `rod` is the binding and model layer

## Distribution

Readable:

- `packages/core/dist/cms.js`
- `packages/ui/dist/ui.js`
- `packages/jsswift/dist/jsswift.js`

Minified:

- `packages/core/dist/min-cms.js`
- `packages/ui/dist/min-ui.js`
- `packages/jsswift/dist/min-jsswift.js`

Legacy local mirror:

- `pages/_jsswift-fe/js/cms.js`
- `pages/_jsswift-fe/js/min-cms.js`
- `pages/_jsswift-fe/js/ui.js`
- `pages/_jsswift-fe/js/min-ui.js`

## Notes

This release remains the historical base of the first release discipline.
The final step that closed the real publication later flowed into `v1.0.1`, together with:

- browser smoke validation
- the official published version
- final changelog and release-gate closure
