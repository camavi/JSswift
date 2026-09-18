# JSswift v1.0.22 Release Notes

Release date: 2026-04-30

`v1.0.22` patches `UI.Search` interaction behavior after the `v1.0.21` component release.

## Fixed

- Clicking a search result now selects that item consistently.
- Moving the pointer over a result no longer causes a list rerender before the click event can run.
- Focusing a search input no longer opens an empty result panel when there is no content to show.

## Changed

- Package versions bumped to `1.0.22` for `@jsswift/core`, `@jsswift/ui`, and `jsswift`.
- CDN examples now pin `1.0.22`.

## Verification

- `npm run build:runtime`
- `npm test`
- `npm run test:browser`
