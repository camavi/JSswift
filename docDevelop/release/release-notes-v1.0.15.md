# JSswift v1.0.15 Release Notes

Status:

- patch release prepared to fix mobile overlay clamping for `Menu` and
  `ContextMenu`

## Summary

`v1.0.15` fixes the overlay positioning layer used by `UI.Menu` and
`UI.ContextMenu`. Responsive widths were already applied correctly in `v1.0.14`,
but the final positioning step could still place the panel outside the mobile
viewport. The overlay engine now clamps the final coordinates inside the
viewport gutter and repositions the panel after responsive width styles are
applied.

## Fixed

- anchored overlays now clamp their final `left` and `top` inside viewport
  gutters instead of letting wide panels overflow the screen
- the positioning engine now flips to the opposite side when the preferred
  placement does not have enough space and the alternate side is better
  available
- overlay entries now expose a `reposition()` path so components can recalculate
  coordinates after responsive classes and custom properties change panel size
- `UI.Menu` now repositions after `applyEntryOptions()` and during `update()`
  so responsive `width`, `minWidth`, and `maxWidth` are measured before the
  final placement is committed
- `UI.ContextMenu` inherits the same corrected clamping behavior through the
  shared menu overlay stack

## Tests

- full browser regression coverage for:
  - mobile `Menu` with `width: "calc(100vw - 32px)"`
  - mobile `ContextMenu` with the same responsive width
  - existing responsive Grid, GridCol, Toolbar, Card section, and Avatar cases

## Compatibility

- `placement` remains a preference and is preserved when space allows
- responsive width props and generated `cms-rsp-*` classes are unchanged
- existing overlay consumers keep the same public API
