# JSswift v1.0.7 Release Notes

Status:

- patch release prepared to ship the official JSswift SVG logo, local demo branding, and package-level logo asset exports

## Summary

`v1.0.7` makes the JSswift logo a real runtime asset instead of an external reference. The local demos now use the official SVG as favicon and visible brand mark, and consumers can import the same logo directly from the published UI and umbrella packages.

## Added

- official JSswift logo asset at `pages/_jsswift-fe/img/logo.svg`
- published asset exports:
  - `@jsswift/ui/img/logo.svg`
  - `jsswift/img/logo.svg`
- visible brand lockup in the local demo pages
- SVG favicon coverage for the demo pages

## Changed

- `pages/config-fe/setting.js` now points `logo` and `favicon` to the local SVG asset
- README now displays the official logo and documents where the asset is available after install
- package versions bumped to `1.0.7`

## Compatibility

- the release is backward-compatible and keeps the existing JS and CSS entry points unchanged
- consumers that do not use the new logo asset do not need to change any import path
