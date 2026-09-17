# JSswift v1.0.12 Release Notes

Status:

- patch release prepared to fix responsive `gap` on `UI.Toolbar`

## Summary

`v1.0.12` fixes a Toolbar-specific responsive cascade issue. `UI.Toolbar`
previously emitted an inline `gap: var(--cms-toolbar-gap)` style even when
responsive `gap` overrides were present. That inline style won over the
responsive `.cms-rsp-gap` classes, so `tablet.gap` and `pc.gap` could be present
in the DOM but not affect computed layout.

## Fixed

- `UI.Toolbar` no longer emits inline `style.gap` when responsive `gap`
  overrides are configured
- responsive `gap` now applies correctly across mobile, tablet, and pc
- responsive `direction` continues to work together with responsive `gap`

## Tests

- added browser regression coverage for:
  - mobile `Toolbar({ gap: "sm" })`
  - tablet `Toolbar({ tablet: { gap: "md" } })`
  - pc `Toolbar({ pc: { gap: "lg" } })`
  - responsive `direction` changing from `column` to `row`

## Compatibility

- existing non-responsive Toolbar gap behavior is unchanged
- explicit user-provided `style.gap` still remains under user control
- consumers using responsive Toolbar examples no longer need inline gap
  workarounds
