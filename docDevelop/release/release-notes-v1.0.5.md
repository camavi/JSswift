# JSswift v1.0.5 Release Notes

Status:

- patch release prepared to ship native input styling polish and small demo alignment updates

## Summary

`v1.0.5` adds a baseline style for native `input` elements in the generated UI CSS, aligns field surfaces with the active theme tokens, and updates local demo coverage.

## Added

- baseline styling for native `input` elements in `ui.css`, `min-ui.css`, and `ui.min.css`
- local demo coverage for both `_.input()` and `_.Input()` helpers

## Changed

- `.cms-field > .cms-control` now uses a theme surface token to improve contrast and visual consistency
- the home page CTA styling was aligned so the UI entry action matches the other landing buttons

## Compatibility

- the release is backward-compatible and keeps the existing package entry points unchanged
- consumers importing JSswift CSS receive the native `input` baseline style automatically
