# JSswift v1.0.2 Release Notes

Status:

- patch release prepared for npm and CDN clarity
- adds conventional minified CDN aliases without removing existing file names

## Summary

`v1.0.2` keeps the existing runtime outputs and adds conventional minified aliases that are easier to discover and use from a CDN.

## Included In v1.0.2

Core:

- added `dist/cms.min.js` as an alias of `dist/min-cms.js`
- exported `./cms.min.js` from `@jsswift/core`

UI:

- added `dist/ui.min.js` as an alias of `dist/min-ui.js`
- added `dist/css/ui.min.css` as an alias of `dist/css/min-ui.css`
- exported `./ui.min.js` and `./css/ui.min.css` from `@jsswift/ui`

Umbrella:

- added `dist/jsswift.min.js` as an alias of `dist/min-jsswift.js`
- added `dist/css/ui.min.css` to the bundled CSS assets
- exported `./jsswift.min.js` and `./css/ui.min.css` from `jsswift`

Docs:

- README CDN examples now show both readable and minified URLs
- Quick Start keeps `const _ = window._;` explicit for tooling clarity

## Compatibility

Existing paths remain valid:

- `dist/min-cms.js`
- `dist/min-ui.js`
- `dist/min-jsswift.js`
- `dist/css/min-ui.css`

The new aliases are additive and do not break existing consumers.
