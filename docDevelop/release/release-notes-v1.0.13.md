# JSswift v1.0.13 Release Notes

Status:

- patch release prepared to add responsive prop support to card sections

## Summary

`v1.0.13` fixes responsive props on `UI.cardHeader`, `UI.cardBody`, and
`UI.cardFooter`. These helpers already stripped breakpoint props from DOM
attributes, but they did not apply the responsive style engine, so `mobile`,
`tablet`, and `pc` overrides were ignored.

## Fixed

- `cardHeader` now applies responsive `gap`, `align`, `justify`, `wrap`, and
  `direction`
- `cardFooter` now applies responsive `gap`, `align`, `justify`, `wrap`, and
  `direction`
- `cardBody` now applies responsive common and layout style props such as
  `padding`, `gap`, `direction`, and `width`
- `Card` root now supports the full responsive style rule set for layout props
  such as `display`, `direction`, `gap`, and `cols`
- inline section styles no longer lock `gap`, `alignItems`, `justifyContent`,
  `flexWrap`, or `flexDirection` when a breakpoint override exists

## Tests

- added browser regression coverage for:
  - responsive `cardHeader` gap and justify
  - responsive `cardBody` padding
  - responsive `cardFooter` direction
  - responsive `Card` root layout/gap

## Compatibility

- existing non-responsive card section behavior is preserved
- breakpoint props now work consistently with Toolbar, Grid, and GridCol
