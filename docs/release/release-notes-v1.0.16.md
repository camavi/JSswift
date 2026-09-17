# JSswift v1.0.16 Release Notes

Status:

- patch release prepared to harden menu overlay viewport clamping after the
  `v1.0.15` follow-up validation

## Summary

`v1.0.16` closes the remaining real-browser edge case for responsive `Menu` and
`ContextMenu` overlays on mobile. `v1.0.15` added clamp and flip logic, but the
panel could still drift outside the viewport when its final size changed after
open. The overlay engine now tracks the effective visual viewport and watches
panel resizes so the final placement is recomputed when width grows after the
first paint.

## Fixed

- anchored overlays now clamp against `window.visualViewport` when available,
  including `offsetLeft` and `offsetTop`
- overlay positioning now reacts to late panel size changes through a
  `ResizeObserver` on the panel root
- overlay positioning also refreshes on `visualViewport.resize` and
  `visualViewport.scroll`
- mobile `Menu` and `ContextMenu` panels stay inside viewport gutters even when
  responsive width resolves after open or grows on the next frame

## Tests

- browser regression coverage now includes:
  - mobile `Menu` viewport clamp with responsive width
  - mobile `ContextMenu` viewport clamp with responsive width
  - `Menu` repositioning after panel width grows after open
  - the existing responsive Grid, GridCol, Toolbar, Card, and Avatar checks

## Compatibility

- public overlay and menu APIs are unchanged
- `placement` remains a preference with automatic fallback only when required to
  keep the panel inside the visible viewport
- responsive prop names and generated `cms-rsp-*` classes are unchanged
