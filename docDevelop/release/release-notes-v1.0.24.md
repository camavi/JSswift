# JSswift v1.0.24 Release Notes

Release date: 2026-05-05

`v1.0.24` expands `UI.Layout` with named disposition presets and local/global layout mode metadata.

## Changed

- Added layout disposition presets for `classic`, `classicRight`, `sidebarFullLeft`, `sidebarFullRight`, `appShell`, `dashboard`, `website`, `documentation`, and `landing`.
- Added `mode` / `layoutMode` metadata for local and global layout behavior.
- Regenerated readable and minified UI runtime bundles after the layout update.
- Package versions bumped to `1.0.24` for `@jsswift/core`, `@jsswift/ui`, and `jsswift`.
- CDN examples now pin `1.0.24`.

## Verification

- `npm run build:runtime`
- `npm test`
