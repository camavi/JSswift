# JSswift v1.0.21 Release Notes

Release date: 2026-04-30

`v1.0.21` introduces `UI.Search`, refreshes the generated runtime bundles, and republishes the three public packages.

## Added

- `UI.Search` / `_.Search` component with `FormField` integration.
- GET search support through `endpoint`, `queryParam`, `params`, debounce, cancellation, and optional cache.
- Local item search through `items`, `options`, or `suggestions`.
- Keyboard navigation for search results with arrows, Enter, Escape, and first/last shortcuts.
- Search slots for `result`, `empty`, `loading`, and `error`.
- Search demo coverage in the UI playground.

## Changed

- Package versions bumped to `1.0.21` for `@jsswift/core`, `@jsswift/ui`, and `jsswift`.
- CDN examples now pin `1.0.21`.
- Public README now points to the official site: `https://www.jsswift.com/`.

## Fixed

- Search floating label and placeholder no longer overlap.
- Search control styling was refined for a cleaner default field appearance.

## Verification

- `npm run build:runtime`
- `npm test`
- `npm run test:browser`
