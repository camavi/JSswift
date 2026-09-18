# JSswift v1.0.1 Release Notes

Status:

- published on npm
- patch release focused on consolidation after the first package-oriented release layout

## Summary

`v1.0.1` is the first JSswift release published and verified in a real npm and browser project.

Included packages:

- `@jsswift/core@1.0.1`
- `@jsswift/ui@1.0.1`
- `jsswift@1.0.1`

## Included In v1.0.1

Core:

- safe bootstrap even when `window.JSswift_setting` is not defined
- safe fallback behavior for HTTP configuration

UI:

- package aligned to `@jsswift/core@^1.0.1`
- CSS exports verified in a real npm installation

Umbrella:

- `jsswift` published as a single-package distribution
- self-contained `dist/` with:
  - `jsswift.js`
  - `min-jsswift.js`
  - CSS
  - fonts
  - images

## Distribution

npm:

- `@jsswift/core`
- `@jsswift/ui`
- `jsswift`

Readable:

- `packages/core/dist/cms.js`
- `packages/ui/dist/ui.js`
- `packages/jsswift/dist/jsswift.js`

Minified:

- `packages/core/dist/min-cms.js`
- `packages/ui/dist/min-ui.js`
- `packages/jsswift/dist/min-jsswift.js`

## Validation

Executed checks:

- repository runtime build
- real npm test with `@jsswift/core + @jsswift/ui`
- real npm test with the single package `jsswift`
- browser/Vite build in the external test project

## Notes

`v1.0.1` is the first truly consumable public package baseline for the framework.

Still recommended:

- pin versions on npm and CDN
- use Vite or an equivalent browser-oriented environment
- upgrade Node to `20.19+` to match modern Vite requirements
