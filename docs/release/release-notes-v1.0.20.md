# JSswift v1.0.20 Release Notes

Status:

- patch release prepared to harden fullscreen `Dialog` mobile viewport clamping

## Summary

`v1.0.20` tightens the fullscreen `Dialog` mobile path after `v1.0.19`.
The runtime now reapplies fullscreen viewport sizing on the next animation
frame, rounds viewport dimensions to real device pixels, and makes the CSS
fullscreen frame explicit with `inset: 0`, `min-height`, `box-sizing:
border-box`, `overflow: hidden`, and `transform: none`.

The browser regression was also upgraded from a simple headless window-size
probe to a real Chrome DevTools mobile emulation flow at `390x844`, which
matches the failing repro much more closely.

## Fixed

- fullscreen `Dialog` now rounds `visualViewport` offsets and dimensions before
  applying inline sizing on the panel
- fullscreen viewport sync now runs immediately and again on the next animation
  frame, reducing stale layout during mobile open/render
- fullscreen viewport cleanup now clears the extra `min-height` and `overflow`
  overrides
- fullscreen dialog CSS now explicitly sets:
  - `inset: 0`
  - `min-height`
  - `box-sizing: border-box`
  - `overflow: hidden`
  - `transform: none`

## Tests

- browser regression for fullscreen `Dialog` now uses Chrome DevTools mobile
  emulation instead of desktop `--window-size` only
- the regression validates the final settled `getBoundingClientRect()` on
  `390x844`, including `position`, borders, box sizing, and viewport bounds
- existing responsive browser regressions for Grid, GridCol, Toolbar, Card,
  Menu, ContextMenu, and Avatar remain green

## Compatibility

- `UI.Dialog` public API is unchanged
- the change affects only fullscreen dialog sizing and placement
- standard dialogs remain unchanged
- Vite dev servers that already optimized a previous `jsswift` build may need
  a restart or dependency re-optimization to pick up the new bundle
